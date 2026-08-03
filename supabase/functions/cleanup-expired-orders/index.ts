// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Edge Function: cleanup-expired-orders
 * 
 * Cancela automaticamente pedidos Pix que estão com status "Pendente"
 * há mais de 30 minutos (tempo de expiração do QR Code Pix).
 * 
 * Pode ser chamada via:
 * - Cron job do Supabase (pg_cron)
 * - Chamada HTTP manual/periódica
 * - Supabase scheduled function
 */

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Busca pedidos com status "Pendente" criados há mais de 30 minutos
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id, created_at, payment, total')
      .eq('status', 'Pendente')
      .lt('created_at', thirtyMinutesAgo);

    if (fetchError) {
      throw new Error('Erro ao buscar pedidos expirados: ' + JSON.stringify(fetchError));
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum pedido expirado encontrado', cancelled: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`[CLEANUP] Encontrados ${expiredOrders.length} pedidos pendentes há mais de 30min`);

    let cancelledCount = 0;
    const results = [];

    for (const order of expiredOrders) {
      // Antes de cancelar, verificar se por acaso o pagamento foi aprovado no MP
      // (pode ter sido aprovado mas o webhook falhou)
      let shouldCancel = true;

      if (MP_ACCESS_TOKEN && order.payment === 'Pix') {
        try {
          // Busca pagamentos por external_reference (order ID)
          const searchRes = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${order.id}&sort=date_created&criteria=desc&range=date_created&begin_date=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&end_date=${new Date().toISOString()}`,
            { headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` } }
          );

          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const payments = searchData.results || [];
            
            // Se encontrou pagamento aprovado, NÃO cancelar — atualizar como pago
            const approvedPayment = payments.find((p: any) => p.status === 'approved');
            if (approvedPayment) {
              console.log(`[CLEANUP] Pedido ${order.id} tem pagamento aprovado no MP (ID: ${approvedPayment.id}). Atualizando ao invés de cancelar.`);
              
              const { error: updateError } = await supabase
                .from('orders')
                .update({ status: 'Em Preparo', payment_status: 'approved' })
                .eq('id', order.id);

              if (!updateError) {
                results.push({ id: order.id, action: 'recovered', mp_payment_id: approvedPayment.id });
              }
              shouldCancel = false;
            }
          }
        } catch (mpError) {
          console.error(`[CLEANUP] Erro ao verificar MP para pedido ${order.id}:`, mpError);
          // Se não consegue verificar no MP, cancela por segurança
        }
      }

      if (shouldCancel) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'Cancelado', payment_status: 'expired' })
          .eq('id', order.id);

        if (!updateError) {
          cancelledCount++;
          results.push({ id: order.id, action: 'cancelled' });
          console.log(`[CLEANUP] Pedido ${order.id} cancelado por expiração`);
        } else {
          console.error(`[CLEANUP] Erro ao cancelar pedido ${order.id}:`, updateError);
          results.push({ id: order.id, action: 'error', error: updateError.message });
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Cleanup concluído. ${cancelledCount} pedidos cancelados.`,
        cancelled: cancelledCount,
        total_checked: expiredOrders.length,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[CLEANUP] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
})
