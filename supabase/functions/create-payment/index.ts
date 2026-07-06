// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { items, payer, orderId, webhookUrl } = await req.json()

    // Initialize Supabase client to fetch configurations if necessary,
    // or just rely on Environment variables for Mercado Pago token
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    
    if (!MP_ACCESS_TOKEN) {
      throw new Error('MERCADO PAGO ACCESS TOKEN is not set')
    }

    // Prepare preference payload for Mercado Pago
    const preferenceData = {
      items: items.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        currency_id: 'BRL',
        unit_price: item.unit_price,
      })),
      payer: {
        name: payer.name,
        email: payer.email || 'cliente@email.com',
      },
      back_urls: {
        success: `${req.headers.get('origin')}/?status=success&order_id=${orderId}`,
        failure: `${req.headers.get('origin')}/?status=failure&order_id=${orderId}`,
        pending: `${req.headers.get('origin')}/?status=pending&order_id=${orderId}`
      },
      auto_return: 'approved',
      external_reference: orderId, // Store your order ID here so webhook knows
      notification_url: webhookUrl || 'https://seu-projeto.supabase.co/functions/v1/payment-webhook' // Placeholder for webhook URL
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferenceData),
    })

    const mpData = await response.json()

    if (!response.ok) {
      console.error('Mercado Pago Error:', mpData)
      throw new Error('Failed to create preference')
    }

    return new Response(
      JSON.stringify({ 
        preferenceId: mpData.id, 
        init_point: mpData.init_point 
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
