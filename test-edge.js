const fetch = require('node-fetch');

// Simulando exatamente o que o Mercado Pago envia quando processa um pagamento
// Para testar se o webhook está recebendo e processando corretamente
async function testWebhookWithRealFormat() {
    console.log("Testando formato EXATO que o Mercado Pago envia...\n");

    // Teste 1: Formato novo (Checkout Bricks)
    console.log("=== Teste 1: Formato payment.created (Bricks) ===");
    const res1 = await fetch("https://sbughjstbuhivenmyagc.supabase.co/functions/v1/payment-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "payment.created",
            api_version: "v1",
            data: { id: "99999999" },
            date_created: new Date().toISOString(),
            id: 12345,
            live_mode: false,
            type: "payment",
            user_id: "test"
        })
    });
    console.log("Status:", res1.status);
    console.log("Response:", await res1.text());

    console.log("\n=== Teste 2: Formato payment.updated (Bricks) ===");
    const res2 = await fetch("https://sbughjstbuhivenmyagc.supabase.co/functions/v1/payment-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "payment.updated",
            api_version: "v1",
            data: { id: "99999999" },
            date_created: new Date().toISOString(),
            id: 12345,
            live_mode: false,
            type: "payment",
            user_id: "test"
        })
    });
    console.log("Status:", res2.status);
    console.log("Response:", await res2.text());

    console.log("\n=== Teste 3: Formato com query param type=payment ===");
    const res3 = await fetch("https://sbughjstbuhivenmyagc.supabase.co/functions/v1/payment-webhook?type=payment&data.id=99999999", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment.updated", data: { id: "99999999" } })
    });
    console.log("Status:", res3.status);
    console.log("Response:", await res3.text());
}

testWebhookWithRealFormat();
