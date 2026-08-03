// @ts-nocheck
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { mp_payment_id, order_id } = await req.json();

    if (!mp_payment_id) {
      throw new Error('mp_payment_id é obrigatório');
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN não configurado');
    }

    // Consulta o status do pagamento diretamente no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${mp_payment_id}`, {
      headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
    });

    const mpData = await mpResponse.json();
    console.log('[CHECK-PAYMENT] MP status:', mpData.status, '| order_id:', order_id);

    if (!mpResponse.ok) {
      throw new Error('Erro ao consultar Mercado Pago: ' + JSON.stringify(mpData));
    }

    const mpStatus = mpData.status; // 'approved', 'pending', 'rejected', etc.

    // Se aprovado, atualiza o banco de dados também (fonte de verdade)
    if (mpStatus === 'approved' && order_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { error } = await supabase
          .from('orders')
          .update({ status: 'Em Preparo', payment_status: 'approved' })
          .eq('id', order_id);

        if (error) {
          console.error('[CHECK-PAYMENT] Supabase update error:', error);
        } else {
          console.log('[CHECK-PAYMENT] Order', order_id, 'updated to Em Preparo');
        }
      }
    }

    return new Response(
      JSON.stringify({ mp_status: mpStatus, approved: mpStatus === 'approved' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[CHECK-PAYMENT] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
