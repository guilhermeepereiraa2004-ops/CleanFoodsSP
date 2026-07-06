// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    // Mercado Pago sends notifications either via POST body or GET query params depending on the config
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (topic === 'payment' && id) {
      const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
      
      // Fetch payment details to get external_reference (our order ID) and status
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
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
            if (status === 'approved') dbStatus = 'Preparando' // Or 'Pago'
            else if (status === 'rejected' || status === 'cancelled') dbStatus = 'Cancelado'

            const { error } = await supabase
              .from('transactions')
              .update({ status: dbStatus }) // Assuming you have a status column
              .eq('id', orderId) // If transaction table doesn't use id like this, map appropriately
              
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
