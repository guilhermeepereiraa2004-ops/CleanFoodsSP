// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://www.cleanfoodsp.com.br',
  'https://cleanfoodsp.com.br',
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paymentData = await req.json()

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADO PAGO ACCESS TOKEN is not set')
    }

    // --- SECURITY: Validate payment amount against order in database ---
    const externalRef = paymentData.external_reference;
    if (!externalRef) {
      throw new Error('external_reference (ID do pedido) é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('total')
        .eq('id', externalRef)
        .single();

      if (orderError || !order) {
        throw new Error(`Pedido ${externalRef} não encontrado no banco de dados.`);
      }

      const expectedTotal = parseFloat(order.total);
      const sentAmount = parseFloat(paymentData.transaction_amount);

      // Allow a tiny tolerance for floating point rounding (1 cent)
      if (Math.abs(expectedTotal - sentAmount) > 0.02) {
        console.error(`FRAUD ATTEMPT: Order ${externalRef} total is ${expectedTotal} but payment sent ${sentAmount}`);
        throw new Error(`Valor do pagamento (R$${sentAmount.toFixed(2)}) não corresponde ao valor do pedido (R$${expectedTotal.toFixed(2)}).`);
      }
    }
    // --- END SECURITY ---

    // Clean up payer information for Mercado Pago
    if (paymentData.payer) {
      // Remove formatting from CPF/CNPJ
      if (paymentData.payer.identification?.number) {
        paymentData.payer.identification.number = paymentData.payer.identification.number.replace(/\D/g, '');
      }
      
      // Some Mercado Pago integrations fail if first_name contains spaces and last_name is empty
      // But typically Bricks sends this correctly. We will just ensure no weird characters.
      if (paymentData.payer.first_name && !paymentData.payer.last_name) {
         const nameParts = paymentData.payer.first_name.trim().split(' ');
         if (nameParts.length > 1) {
            paymentData.payer.first_name = nameParts[0];
            paymentData.payer.last_name = nameParts.slice(1).join(' ');
         }
      }
    }

    // Include idempotency key to prevent double charging
    const idempotencyKey = req.headers.get('x-idempotency-key') || crypto.randomUUID();

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    })

    const mpData = await response.json()

    if (!response.ok) {
      console.error('Mercado Pago Error:', mpData)
      throw new Error(mpData.message || 'Failed to create payment')
    }

    return new Response(
      JSON.stringify(mpData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
