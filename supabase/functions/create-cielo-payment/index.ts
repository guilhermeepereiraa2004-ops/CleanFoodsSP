import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://www.cleanfoodsp.com.br',
  'https://cleanfoodsp.com.br',
  'https://cleanfoods1.vercel.app',
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

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const paymentData = await req.json()
    
    // Cielo Credentials
    const CIELO_MERCHANT_ID = Deno.env.get('CIELO_MERCHANT_ID') || 'b1dda6d6-0f08-40b2-ad3f-40645d532161';
    const CIELO_MERCHANT_KEY = Deno.env.get('CIELO_MERCHANT_KEY') || 'TEZNuSt3AIIeOZfpovQjm0pslmg9UlzrH4hXq22L';

    const externalRef = paymentData.external_reference;
    if (!externalRef) {
      throw new Error('external_reference (ID do pedido) é obrigatório');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    let expectedTotal = 0;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      let order = null;
      let retries = 3;
      
      while (retries > 0) {
        const result = await supabase
          .from('orders')
          .select('total, status, client_name')
          .eq('id', externalRef)
          .single();
          
        if (result.data && !result.error) {
          order = result.data;
          break;
        }
        
        retries--;
        if (retries > 0) {
          await new Promise(res => setTimeout(res, 500));
        }
      }

      if (order) {
        expectedTotal = parseFloat(order.total);
        const sentAmount = parseFloat(paymentData.transaction_amount);

        if (Math.abs(expectedTotal - sentAmount) > 0.02) {
          throw new Error(`Valor do pagamento (R$${sentAmount.toFixed(2)}) não corresponde ao valor do pedido (R$${expectedTotal.toFixed(2)}).`);
        }
      }
    }

    if (expectedTotal === 0) {
       expectedTotal = parseFloat(paymentData.transaction_amount);
    }

    // Convert to cents for Cielo API
    const amountInCents = Math.round(expectedTotal * 100);

    const cieloPayload = {
      MerchantOrderId: externalRef,
      Customer: {
        Name: paymentData.payer?.first_name || "Cliente CleanFoods"
      },
      Payment: {
        Type: "CreditCard",
        Amount: amountInCents,
        Provider: paymentData.vr_brand || "Simulado", // Alelo, Ticket, Sodexo, etc.
        Installments: 1,
        CreditCard: {
          CardNumber: paymentData.card_number.replace(/\D/g, ''),
          Holder: paymentData.card_holder_name,
          ExpirationDate: paymentData.card_expiration_date, // format MM/YYYY
          SecurityCode: paymentData.card_cvv,
          Brand: paymentData.vr_brand || "Visa"
        }
      }
    };

    const response = await fetch('https://api.cieloecommerce.cielo.com.br/1/sales/', {
      method: 'POST',
      headers: {
        'MerchantId': CIELO_MERCHANT_ID,
        'MerchantKey': CIELO_MERCHANT_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cieloPayload),
    });

    const cieloData = await response.json();

    if (!response.ok) {
      console.error('Cielo Error:', cieloData);
      throw new Error(cieloData.length ? cieloData[0].Message : 'Failed to create payment in Cielo');
    }

    // Typical Cielo Approval Statuses: 1 (Authorized), 2 (Payment Confirmed)
    // 0 is Created, but not authorized yet (usually requires capture, but some VR are auto-capture)
    const isApproved = [1, 2].includes(cieloData.Payment?.Status);

    return new Response(
      JSON.stringify({ 
         status: isApproved ? 'approved' : 'rejected', 
         cielo_response: cieloData,
         payment_id: cieloData.Payment?.PaymentId
      }),
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
