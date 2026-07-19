const fs = require('fs');

function refactorFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // FIX EXTRA DIV IN CARDAPIO
    if (file.includes('cardapio-completo.html')) {
        content = content.replace('                    <div id="coupon-feedback" class="text-xs font-bold mt-2 hidden"></div>\n                </div>\n\n                </div>', '                    <div id="coupon-feedback" class="text-xs font-bold mt-2 hidden"></div>\n                </div>');
    }

    // 1. Remove Forma de Pagamento from HTML
    const paymentHtmlRegex = /<!-- Payment Method -->[\s\S]*?<div\s*class="grid grid-cols-1 md:grid-cols-2 gap-4">/g;
    content = content.replace(paymentHtmlRegex, '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">');

    // 2. Replace Action Buttons and add Payment Step Container
    const actionButtonsRegex = /<!-- Mercado Pago Brick Container -->[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/g;
    const newActionButtons = `
                <!-- Action Buttons -->
                <div id="checkout-buttons-container" class="flex gap-4 pt-2">
                    <button type="button" onclick="toggleCheckoutModal()"
                        class="w-1/2 bg-cf-gray text-white font-impact text-lg uppercase tracking-widest py-3 border-2 border-cf-gray hover:bg-white hover:text-cf-black hover:border-white transition-all cursor-hover rounded-sm"
                        style="clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);">
                        Voltar
                    </button>
                    <button type="submit"
                        class="w-1/2 bg-cf-yellow text-cf-black font-impact text-lg uppercase tracking-widest py-3 border-2 border-cf-yellow hover:bg-transparent hover:text-cf-yellow transition-all cursor-hover flex items-center justify-center gap-1.5"
                        style="clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);">
                        Prosseguir <i class="fa-solid fa-arrow-right text-base"></i>
                    </button>
                </div>
            </form>

            <!-- Payment Step Container -->
            <div id="payment-step-container" class="hidden mt-4 pt-4 border-t-2 border-dashed border-cf-gray">
                <h3 class="font-impact text-2xl text-white uppercase tracking-widest text-center mb-6">Pagamento</h3>

                <!-- MP Brick handles Pix and Cartão -->
                <div class="bg-cf-black p-4 rounded border-2 border-cf-gray mb-4">
                    <div id="paymentBrick_container" class="bg-white rounded overflow-hidden p-2 min-h-[300px]"></div>
                </div>

                <div class="mt-2">
                    <button type="button" onclick="goBackToCheckoutForm()"
                        class="w-full bg-cf-gray text-white font-impact text-lg uppercase tracking-widest py-3 border-2 border-cf-gray hover:bg-white hover:text-cf-black hover:border-white transition-all cursor-hover rounded-sm"
                        style="clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);">
                        Voltar para Dados
                    </button>
                </div>
            </div>
        </div>
    </div>`;
    content = content.replace(actionButtonsRegex, newActionButtons);

    // 3. Update toggleCheckoutModal
    const toggleCheckoutMatch = /modal\.classList\.remove\('hidden'\);\n\s*document\.body\.classList\.add\('cart-open-overflow'\);/g;
    content = content.replace(toggleCheckoutMatch, `document.getElementById('checkout-form').classList.remove('hidden');
                const paymentStep = document.getElementById('payment-step-container');
                if (paymentStep) paymentStep.classList.add('hidden');
                
                modal.classList.remove('hidden');
                document.body.classList.add('cart-open-overflow');`);

    // 4. In submitCheckoutForm, modify variables
    content = content.replace("const paymentInput = document.getElementById('client-payment');", "");
    content = content.replace("const payment = paymentInput ? paymentInput.value : '';", "let payment = 'Aguardando';");
    
    const paymentValidationRegex = /if \(!payment\) {[\s\S]*?return;\n\s*}/g;
    content = content.replace(paymentValidationRegex, "");

    // 5. Intercept after order object creation
    const startIndex = content.indexOf("// Save Order to Supabase or fallback");
    let endIndex = content.indexOf("        // Format order info and redirect to WhatsApp\n        function checkoutOrder() {");
    if (endIndex === -1) {
        endIndex = content.indexOf("        function checkoutOrder() {");
    }
    
    if (startIndex !== -1 && endIndex !== -1) {
        const newSaveOrderLogic = `// ------------------ NEW FLOW ------------------
            window.currentOrderData = order;
            
            // Esconde form e mostra o Mercado Pago
            document.getElementById('checkout-form').classList.add('hidden');
            const paymentStep = document.getElementById('payment-step-container');
            if(paymentStep) paymentStep.classList.remove('hidden');
            
            // Inicializa Mercado Pago
            initializePaymentBrick();
            
            isSubmitting = false;
        }

        function goBackToCheckoutForm() {
            document.getElementById('payment-step-container').classList.add('hidden');
            document.getElementById('checkout-form').classList.remove('hidden');
        }

        async function finalizeAndSaveOrder(paymentMethod, mpResponse) {
            const order = window.currentOrderData;
            order.payment = paymentMethod;
            
            // Save Order to Supabase or fallback
            if (window.supabaseClient) {
                try {
                    const dbOrder = {
                        id: order.id,
                        client_name: order.clientName,
                        client_phone: order.clientPhone,
                        address: order.address,
                        payment: order.payment,
                        notes: order.notes,
                        delivery_date: order.deliveryDate,
                        delivery_time: order.deliveryTime,
                        items: order.items,
                        subtotal: parseFloat(order.subtotal),
                        discount: parseFloat(order.discount),
                        total: parseFloat(order.total),
                        status: order.status
                    };
                    const { error } = await window.supabaseClient.from('orders').insert([dbOrder]);
                    if (error) throw error;
                } catch (err) {
                    console.error("Erro ao enviar pedido para o Supabase, salvando localmente:", err);
                    let orders = JSON.parse(localStorage.getItem('cleanfoods_orders')) || [];
                    orders.push(order);
                    localStorage.setItem('cleanfoods_orders', JSON.stringify(orders));
                }
            } else {
                let orders = JSON.parse(localStorage.getItem('cleanfoods_orders')) || [];
                orders.push(order);
                localStorage.setItem('cleanfoods_orders', JSON.stringify(orders));
            }

            // Save Transaction
            if (window.supabaseClient) {
                try {
                    const { error } = await window.supabaseClient.from('transactions').insert([{
                        id: 'TXN-' + Date.now().toString(36).toUpperCase(),
                        order_id: order.id,
                        amount: parseFloat(order.total),
                        payment_method: order.payment,
                        status: paymentMethod === 'Pix' || paymentMethod === 'Cartão de Crédito' ? 'Pendente' : 'Confirmado'
                    }]);
                    if (error) throw error;
                } catch (err) {
                    console.error("Erro ao salvar transação:", err);
                }
            }

            // Show success
            const orderIdSpan = document.getElementById('thank-order-id');
            const orderTotalSpan = document.getElementById('thank-order-total');
            const orderPaymentSpan = document.getElementById('thank-order-payment');
            const orderDeliverySpan = document.getElementById('thank-order-delivery');

            if (orderIdSpan) orderIdSpan.innerText = '#' + order.id;
            if (orderTotalSpan) orderTotalSpan.innerText = 'R$ ' + parseFloat(order.total).toFixed(2).replace('.', ',');
            if (orderPaymentSpan) orderPaymentSpan.innerText = paymentMethod;
            if (orderDeliverySpan) {
                const parts = order.deliveryDate.split('-');
                const formattedDate = parts.length === 3 ? \`\${parts[2]}/\${parts[1]}/\${parts[0]}\` : order.deliveryDate;
                orderDeliverySpan.innerText = \`\${formattedDate} às \${order.deliveryTime}\`;
            }

            const pixInfoContainer = document.getElementById('pix-payment-info');
            if (paymentMethod === 'Pix') {
                if (mpResponse && mpResponse.point_of_interaction) {
                    const qrCodeBase64 = mpResponse.point_of_interaction.transaction_data.qr_code_base64;
                    const qrCodeString = mpResponse.point_of_interaction.transaction_data.qr_code;
                    document.getElementById('pix-qr-code').src = \`data:image/jpeg;base64,\${qrCodeBase64}\`;
                    document.getElementById('pix-copia-cola').value = qrCodeString;
                    if(pixInfoContainer) pixInfoContainer.classList.remove('hidden');
                } else {
                    if(pixInfoContainer) pixInfoContainer.classList.add('hidden');
                }
            } else {
                if(pixInfoContainer) pixInfoContainer.classList.add('hidden');
            }

            const thankModal = document.getElementById('thank-you-modal');
            if (thankModal) {
                thankModal.classList.remove('hidden');
                setTimeout(() => {
                    thankModal.classList.remove('opacity-0');
                }, 10);
            }

            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) {
                checkoutModal.classList.add('opacity-0');
                setTimeout(() => {
                    checkoutModal.classList.add('hidden');
                }, 300);
            }

            cart = {};
            localStorage.setItem('cleanfoods_cart', JSON.stringify(cart));
            if(typeof updateCartBadges === 'function') updateCartBadges();
            if(typeof renderCart === 'function') renderCart();
        }

        let isBrickInitialized = false;
        async function initializePaymentBrick() {
            if (isBrickInitialized) return;
            if (!window.MP_PUBLIC_KEY) {
                console.error("Chave do Mercado Pago não configurada.");
                return;
            }

            const order = window.currentOrderData;
            const mp = new MercadoPago(window.MP_PUBLIC_KEY, { locale: 'pt-BR' });
            const bricksBuilder = mp.bricks();
            
            const settings = {
                initialization: {
                    amount: parseFloat(order.total),
                    preferenceId: null,
                    payer: {
                        email: order.clientName.replace(/\\s+/g, '').toLowerCase() + '@cleanfoods.com',
                    },
                },
                customization: {
                    paymentMethods: {
                        ticket: "all",
                        bankTransfer: "all",
                        creditCard: "all",
                        debitCard: "all"
                    },
                },
                callbacks: {
                    onReady: () => {
                        const brickContainer = document.getElementById('paymentBrick_container');
                        if (brickContainer) {
                            brickContainer.classList.remove('hidden');
                        }
                    },
                    onSubmit: ({ selectedPaymentMethod, formData }) => {
                        formData.description = \`Pedido \${order.id} - \${order.clientName}\`;
                        formData.external_reference = order.id;
                        
                        return new Promise((resolve, reject) => {
                            fetch(\`\${window.SUPABASE_URL}/functions/v1/create-payment\`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": \`Bearer \${window.SUPABASE_ANON_KEY}\`
                                },
                                body: JSON.stringify(formData),
                            })
                            .then(async (response) => {
                                const data = await response.json();
                                if (!response.ok || data.error || data.status === 'rejected' || data.code) {
                                    reject();
                                    alert("Erro no pagamento: " + (data.error || data.message || "Pagamento recusado"));
                                    return;
                                }
                                resolve();
                                
                                const pMethod = formData.payment_method_id === 'pix' ? 'Pix' : 'Cartão de Crédito';
                                finalizeAndSaveOrder(pMethod, data);
                            })
                            .catch((error) => {
                                reject();
                                alert("Erro de conexão ao processar pagamento.");
                            });
                        });
                    },
                    onError: (error) => {
                        console.error(error);
                        alert("Ocorreu um erro ao carregar o pagamento.");
                    },
                },
            };
            
            if (window.paymentBrickController) window.paymentBrickController.unmount();
            window.paymentBrickController = await bricksBuilder.create("payment", "paymentBrick_container", settings);
            isBrickInitialized = true;
        }
\n`;
        content = content.slice(0, startIndex) + newSaveOrderLogic + "\n" + content.slice(endIndex);
    } else {
        console.log("Failed to find saveOrder bounds in " + file);
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log("Refactored " + file);
}

refactorFile('index.html');
refactorFile('cardapio-completo.html');
