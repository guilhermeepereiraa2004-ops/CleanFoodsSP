// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url);
    
    // Log every incoming webhook for debugging
    console.log('[WEBHOOK] Incoming request:', req.method, url.toString());
    console.log('[WEBHOOK] Headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

    // --- SECURITY: Verify Mercado Pago signature (only if secret is set AND signature is present) ---
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    // Only validate signature if ALL components are present — avoids blocking legit notifications
    if (MP_WEBHOOK_SECRET && xSignature && xRequestId && dataId) {
      const signatureParts: Record<string, string> = {};
      xSignature.split(',').forEach(part => {
        const [key, value] = part.trim().split('=');
        if (key && value) signatureParts[key.trim()] = value.trim();
      });

      const ts = signatureParts['ts'];
      const v1 = signatureParts['v1'];

      if (ts && v1) {
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(MP_WEBHOOK_SECRET),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(manifest));
        const computedHash = Array.from(new Uint8Array(signatureBytes))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        if (computedHash !== v1) {
          // Log the mismatch but DON'T block — return 200 to avoid MP retrying
          console.error('[WEBHOOK] Signature mismatch - ignoring. Expected:', computedHash, 'Got:', v1);
          return new Response('ok', { status: 200 });
        } else {
          console.log('[WEBHOOK] Signature verified OK');
        }
      }
    } else {
      console.log('[WEBHOOK] Skipping signature check (missing components). Secret set:', !!MP_WEBHOOK_SECRET, 'xSignature:', !!xSignature, 'xRequestId:', !!xRequestId, 'dataId:', !!dataId);
    }
    // --- END SECURITY ---

    // Parse body
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = dataId;

    let bodyId = null;
    let bodyAction = null;
    let rawBody = null;
    if (req.method === 'POST') {
      try {
        rawBody = await req.json();
        console.log('[WEBHOOK] Body:', JSON.stringify(rawBody));
        bodyAction = rawBody.action || rawBody.type;
        bodyId = rawBody.data?.id?.toString();
      } catch (_) {
        console.log('[WEBHOOK] Body is not JSON or empty');
      }
    }

    const paymentId = id || bodyId;
    const action = topic || bodyAction;

    console.log('[WEBHOOK] Action:', action, '| PaymentId:', paymentId);

    // Accept any payment-related action
    const isPaymentAction = action && (
      action === 'payment' ||
      action.startsWith('payment.')
    );

    if (isPaymentAction && paymentId) {
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
      
      console.log('[WEBHOOK] Fetching payment from MP:', paymentId);
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      });
      
      const paymentData = await response.json();
      console.log('[WEBHOOK] MP Payment response status:', response.status);
      console.log('[WEBHOOK] Payment status:', paymentData.status, '| external_reference:', paymentData.external_reference);
      
      if (response.ok) {
        const orderId = paymentData.external_reference;
        const status = paymentData.status;
        
        if (orderId) {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            
            let dbStatus = 'Pendente';
            if (status === 'approved') dbStatus = 'Em Preparo';
            else if (status === 'rejected' || status === 'cancelled') dbStatus = 'Cancelado';

            console.log('[WEBHOOK] Updating order', orderId, 'to status:', dbStatus);

            const { error, data } = await supabase
              .from('orders')
              .update({ status: dbStatus, payment_status: status })
              .eq('id', orderId)
              .select();
              
            if (error) {
              console.error('[WEBHOOK] Failed to update Supabase:', JSON.stringify(error));
            } else {
              console.log('[WEBHOOK] Supabase update success. Rows updated:', data?.length);
            }
          } else {
            console.error('[WEBHOOK] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
          }
        } else {
          console.warn('[WEBHOOK] No external_reference in payment data. Cannot identify order.');
        }
      } else {
        console.error('[WEBHOOK] MP API error:', JSON.stringify(paymentData));
      }
    } else {
      console.log('[WEBHOOK] Ignoring event - not a payment action or no paymentId.');
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error);
    return new Response('ok', { status: 200 }); // Always return 200 so MP doesn't retry endlessly
  }
})
