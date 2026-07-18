// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // --- SECURITY: Verify Mercado Pago signature ---
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET');

    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (MP_WEBHOOK_SECRET && xSignature && xRequestId && dataId) {
      // Parse the x-signature header
      const signatureParts: Record<string, string> = {};
      xSignature.split(',').forEach(part => {
        const [key, value] = part.trim().split('=');
        if (key && value) signatureParts[key.trim()] = value.trim();
      });

      const ts = signatureParts['ts'];
      const v1 = signatureParts['v1'];

      if (ts && v1) {
        // Build the manifest string as per MP documentation
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

        // Calculate HMAC-SHA256
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
          console.error('WEBHOOK SIGNATURE MISMATCH - Possible forged notification');
          return new Response('Invalid signature', { status: 403 });
        }
      }
    }
    // --- END SECURITY ---

    // Mercado Pago sends notifications either via POST body or GET query params
    const topic = url.searchParams.get('topic') || url.searchParams.get('type');
    const id = dataId;

    // Also handle POST body notifications
    let bodyId = null;
    let bodyAction = null;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        bodyAction = body.action || body.type;
        bodyId = body.data?.id;
      } catch (_) {
        // Body may not be JSON, that's ok
      }
    }

    const paymentId = id || bodyId;
    const action = topic || bodyAction;

    if ((action === 'payment' || action === 'payment.created' || action === 'payment.updated') && paymentId) {
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
      
      // Fetch payment details to get external_reference (our order ID) and status
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
        }
      })
      
      const paymentData = await response.json()
      
      if (response.ok) {
        const orderId = paymentData.external_reference
        const status = paymentData.status // 'approved', 'pending', 'rejected', etc.
        
        if (orderId) {
          // Initialize Supabase admin client to bypass RLS and update order status
          const supabaseUrl = Deno.env.get('SUPABASE_URL')
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey)
            
            // Map MP status to your DB status
            let dbStatus = 'Pendente'
            if (status === 'approved') dbStatus = 'Preparando'
            else if (status === 'rejected' || status === 'cancelled') dbStatus = 'Cancelado'

            const { error } = await supabase
              .from('orders')
              .update({ status: dbStatus, payment_status: status })
              .eq('id', orderId)
              
            if (error) {
              console.error('Failed to update Supabase:', error)
            }
          }
        }
      }
    }

    return new Response('ok', { status: 200 })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new Response('error', { status: 400 })
  }
})
