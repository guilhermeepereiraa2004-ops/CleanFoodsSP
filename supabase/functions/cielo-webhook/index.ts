import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const webhookData = await req.json()
    console.log("[CIELO WEBHOOK] Received payload:", webhookData);

    const externalRef = webhookData.MerchantOrderId;
    const paymentStatus = webhookData.Payment?.Status;

    if (!externalRef) {
      throw new Error('MerchantOrderId not found in payload');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Cielo Status Map
      // 1: Authorized, 2: Payment Confirmed, 15: Scheduled, 0: Not Finished, 3: Denied, 10: Cancelled
      let dbStatus = 'pending';
      if ([1, 2].includes(paymentStatus)) {
          dbStatus = 'approved';
      } else if ([3, 10, 13].includes(paymentStatus)) {
          dbStatus = 'rejected';
      }

      console.log(`[CIELO WEBHOOK] Updating order ${externalRef} to status: ${dbStatus}`);

      const { error } = await supabase
        .from('orders')
        .update({ 
           payment_status: dbStatus,
           status: dbStatus === 'approved' ? 'preparing' : 'cancelled'
        })
        .eq('id', externalRef);

      if (error) {
        console.error("[CIELO WEBHOOK] Supabase Update Error:", error);
        throw error;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error("[CIELO WEBHOOK] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
