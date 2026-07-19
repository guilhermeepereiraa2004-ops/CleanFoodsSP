
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'cf-black': '#0E0E0E',
                        'cf-yellow': '#F6C500',
                        'cf-darkgray': '#1A1A1A',
                        'cf-gray': '#333333',
                    },
                    fontFamily: {
                        'impact': ['Anton', 'sans-serif'],
                        'street': ['Permanent Marker', 'cursive'],
                        'body': ['Inter', 'sans-serif'],
                    }
                }
            }
        }
    

        function copyPixCode() {
            const copyText = document.getElementById("pix-copia-cola");
            copyText.select();
            copyText.setSelectionRange(0, 99999); 
            document.execCommand("copy");
            alert("Código Pix copiado!");
        }

        // Initialize Supabase Client
        let supabaseClient = null;
        if (window.SUPABASE_URL && window.SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
            window.SUPABASE_ANON_KEY && window.SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY") {
            try {
                const { createClient } = supabase;
                supabaseClient = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
            } catch (err) {
                console.error("Erro ao inicializar Supabase:", err);
            }
        }

        // Global Cart and Menu variables
        const defaultDishesRaw = [
            // FRANGO
            { id: 'price-frango-desfiado-pure-batata-doce-legumes', name: '01. Frango desfiado com purê de batata doce e legumes', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            { id: 'price-frango-desfiado-arroz-integral-legumes', name: '02. Frango desfiado com arroz integral e legumes', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            { id: 'price-frango-desfiado-pure-mandioca-legumes', name: '03. Frango desfiado com purê de mandioca e legumes', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            { id: 'price-frango-legumes', name: '04. Frango com legumes', category: 'Frango', priceP: '19,50', priceG: '—' },
            { id: 'price-macarrao-frango-desfiado', name: '05. Macarrão com frango desfiado', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            { id: 'price-escondidinho-frango-moido-mandioca', name: '06. Escondidinho de frango moído com mandioca', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            { id: 'price-escondidinho-frango-moido-batata-doce', name: '07. Escondidinho de frango moído com batata doce', category: 'Frango', priceP: '19,50', priceG: '27,50' },
            // GOURMET
            { id: 'price-escondidinho-frango-mussarela-bufala', name: '08. Escondidinho de frango com mussarela de búfala', category: 'Gourmet', priceP: '27,50', priceG: '34,50' },
            { id: 'price-nhoque-batata-doce-patinho-moido', name: '09. Nhoque de batata doce com patinho moído', category: 'Gourmet', priceP: '28,50', priceG: '35,50' },
            { id: 'price-macarrao-patinho-moido', name: '10. Macarrão com patinho moído', category: 'Gourmet', priceP: '28,50', priceG: '35,50' },
            { id: 'price-strogonoff-frango-arroz-branco', name: '20. Strogonoff de frango com arroz branco', category: 'Gourmet', priceP: '30,50', priceG: '38,50' },
            { id: 'price-nhoque-batata-doce-frango-desfiado', name: '22. Nhoque de batata doce com frango desfiado', category: 'Gourmet', priceP: '22,50', priceG: '29,50' },
            { id: 'price-penne-frango-desfiado-molho', name: '23. Penne com frango desfiado ao molho', category: 'Gourmet', priceP: '22,50', priceG: '29,50' },
            // PATINHO
            { id: 'price-patinho-desfiado-arroz-integral-legumes', name: '11. Patinho desfiado com arroz integral e legumes', category: 'Patinho', priceP: '25,50', priceG: '33,50' },
            { id: 'price-patinho-desfiado-pure-batata-doce-legumes', name: '12. Patinho desfiado com purê de batata doce e legumes', category: 'Patinho', priceP: '25,50', priceG: '33,50' },
            { id: 'price-escondidinho-mandioca-patinho-moido', name: '13. Escondidinho de mandioca com patinho moído', category: 'Patinho', priceP: '25,50', priceG: '33,50' },
            { id: 'price-patinho-legumes', name: '14. Patinho com legumes', category: 'Patinho', priceP: '25,50', priceG: '—' },
            { id: 'price-patinho-desfiado-pure-mandioca-legumes', name: '15. Patinho desfiado com purê de mandioca e legumes', category: 'Patinho', priceP: '25,50', priceG: '33,50' },
            { id: 'price-patinho-moido-arroz-branco-legumes', name: '16. Patinho moído com arroz branco e legumes', category: 'Patinho', priceP: '25,50', priceG: '33,50' },
            // SALGADOS FITNESS
            { id: 'price-coxinha-fit', name: '30. Coxinha Fit', category: 'Salgados', priceP: '8,50', priceG: '—' },
            { id: 'price-kibes', name: '31. Kibes', category: 'Salgados', priceP: '8,50', priceG: '—' },
            { id: 'price-nugfit', name: '32. NugFit', category: 'Salgados', priceP: '12,90', priceG: '—' },
            { id: 'price-pizza-fit', name: '33. Pizza Fit', category: 'Salgados', priceP: '14,90', priceG: '—' },
            { id: 'price-quiche-fit', name: '34. Quiche', category: 'Salgados', priceP: '9,90', priceG: '—' },
            { id: 'price-sucos', name: '35. Sucos', category: 'Salgados', priceP: '10,90', priceG: '—' },
            { id: 'price-tortas-fit', name: '36. Tortas', category: 'Salgados', priceP: '11,90', priceG: '—' }
        ];

        const defaultNutrition = {
            energy: '202kcal',
            carbs: '24gr',
            proteins: '23gr',
            totalFat: '2gr',
            saturatedFat: '0gr',
            transFat: '0gr',
            fiber: '4gr',
            sodium: '200mg'
        };

        const defaultDishes = defaultDishesRaw.map(d => ({...d, nutrition: {...defaultNutrition}}));

        let dishes = [];
        let cart = JSON.parse(localStorage.getItem('cleanfoods_cart')) || {};
        let appliedCoupon = null;
        let activeCategory = 'Todos';

        // Garantir que salgados existam em qualquer fonte de dados
        function ensureSalgados(dishList) {
            const hasSalgados = dishList.some(d => d.category === 'Salgados');
            if (!hasSalgados) {
                const salgadosItems = defaultDishes.filter(d => d.category === 'Salgados');
                return [...dishList, ...salgadosItems];
            }
            return dishList;
        }

        // Supabase Database helpers
        async function loadDishes() {
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('dishes').select('*');
                    if (error) throw error;
                    if (data && data.length > 0) {
                        const localDishes = JSON.parse(localStorage.getItem('cleanfoods_dishes_v2')) || [];
                        dishes = data.map(d => {
                            const localD = localDishes.find(ld => ld.id === d.id);
                            return {
                                id: d.id,
                                name: d.name,
                                category: d.category,
                                priceP: d.price_p || d.priceP || '0,00',
                                priceG: d.price_g || d.priceG || '0,00',
                                available: d.available !== false,
                                image: (localD && localD.image) ? localD.image : (d.image || ''),
                                nutrition: d.nutrition || (localD && localD.nutrition) || {...defaultNutrition}
                            };
                        }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
                        dishes = ensureSalgados(dishes);
                    } else {
                        // Seed database
                        const dbDishes = defaultDishes.map(d => ({
                            id: d.id,
                            name: d.name,
                            category: d.category,
                            price_p: d.priceP,
                            price_g: d.priceG,
                            nutrition: d.nutrition
                        }));
                        const { error: insertError } = await supabaseClient.from('dishes').insert(dbDishes);
                        if (insertError) throw insertError;
                        dishes = defaultDishes;
                    }
                } catch (err) {
                    console.error("Erro ao carregar pratos do Supabase:", err);
                    dishes = JSON.parse(localStorage.getItem('cleanfoods_dishes_v2')) || defaultDishes;
                    dishes = ensureSalgados(dishes);
                }
            } else {
                dishes = JSON.parse(localStorage.getItem('cleanfoods_dishes_v2')) || defaultDishes;
                dishes = ensureSalgados(dishes);
            }
        }

        async function loadSettings() {
            let savedWhatsapp = localStorage.getItem('cleanfoods_whatsapp');
            let savedAddress = localStorage.getItem('cleanfoods_address');
            let savedFrete = localStorage.getItem('cleanfoods_frete');

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('settings').select('*');
                    if (error) throw error;
                    if (data) {
                        const waSetting = data.find(s => s.key === 'whatsapp');
                        if (waSetting) savedWhatsapp = waSetting.value;
                        const addrSetting = data.find(s => s.key === 'address');
                        if (addrSetting) savedAddress = addrSetting.value;
                        const freteSetting = data.find(s => s.key === 'frete');
                        if (freteSetting) savedFrete = freteSetting.value;
                    }
                } catch (err) {
                    console.error("Erro ao carregar configurações do Supabase:", err);
                }
            }

            if (savedFrete) window.systemShippingFee = parseFloat(savedFrete);
            else window.systemShippingFee = 0;

            if (savedWhatsapp) {
                const waFloatingBtn = document.getElementById('wa-floating-btn');
                const waFooterBtn = document.getElementById('wa-footer-btn');
                const waFooterLink = document.getElementById('wa-footer-link');

                if (waFloatingBtn) waFloatingBtn.href = 'https://wa.me/55' + savedWhatsapp;
                if (waFooterBtn) waFooterBtn.href = 'https://wa.me/55' + savedWhatsapp;
                if (waFooterLink) waFooterLink.href = 'https://wa.me/55' + savedWhatsapp;

                const textSpan = document.getElementById('val-whatsapp-text');
                if (textSpan && savedWhatsapp.length >= 10) {
                    const ddd = savedWhatsapp.substring(0, 2);
                    const prefix = savedWhatsapp.length === 11 ? savedWhatsapp.substring(2, 7) : savedWhatsapp.substring(2, 6);
                    const suffix = savedWhatsapp.length === 11 ? savedWhatsapp.substring(7) : savedWhatsapp.substring(6);
                    textSpan.innerText = `(${ddd}) ${prefix}-${suffix}`;
                }
            }

            if (savedAddress) {
                const addressSpan = document.getElementById('val-address-text');
                if (addressSpan) addressSpan.innerText = savedAddress;
            }
        }

        async function loadCoupons() {
            let activeCoupons = [];
            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('coupons').select('*').eq('active', true);
                    if (error) throw error;
                    activeCoupons = data || [];
                } catch (err) {
                    console.error("Erro ao carregar cupons do Supabase:", err);
                    const savedCoupons = JSON.parse(localStorage.getItem('cleanfoods_coupons')) || [];
                    activeCoupons = savedCoupons.filter(c => c.active);
                }
            } else {
                const savedCoupons = JSON.parse(localStorage.getItem('cleanfoods_coupons')) || [];
                activeCoupons = savedCoupons.filter(c => c.active);
            }

            if (activeCoupons.length > 0) {
                const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                const todayDay = daysOfWeek[new Date().getDay()];
                const activeCoupon = activeCoupons.find(c => c.day === todayDay || c.day === 'Todo Dia');
                if (activeCoupon) {
                    const banner = document.getElementById('promo-coupon-banner');
                    const discountVal = document.getElementById('coupon-discount-val');
                    const codeVal = document.getElementById('coupon-code-val');
                    if (banner && discountVal && codeVal) {
                        discountVal.innerText = activeCoupon.discount;
                        codeVal.innerText = activeCoupon.code;
                        banner.classList.remove('hidden');
                    }
                    const couponInput = document.getElementById('cart-coupon-input');
                    if (couponInput) {
                        couponInput.value = activeCoupon.code;
                        applyCartCoupon();
                    }
                }
            }
        }

        // Custom Cursor Logic
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');
        const hoverables = document.querySelectorAll('.cursor-hover, a, button');

        if (window.matchMedia("(pointer: fine)").matches) {
            window.addEventListener('mousemove', (e) => {
                const posX = e.clientX;
                const posY = e.clientY;

                cursorDot.style.left = `${posX}px`;
                cursorDot.style.top = `${posY}px`;

                cursorOutline.animate({
                    left: `${posX}px`,
                    top: `${posY}px`
                }, { duration: 500, fill: "forwards" });
            });

            hoverables.forEach(elem => {
                elem.addEventListener('mouseenter', () => {
                    document.body.classList.add('cursor-hover');
                });
                elem.addEventListener('mouseleave', () => {
                    document.body.classList.remove('cursor-hover');
                });
            });
        }

        // Cart toggle
        function toggleCart() {
            const drawer = document.getElementById('cart-drawer');
            if (drawer) {
                drawer.classList.toggle('open');
                document.body.classList.toggle('cart-open-overflow');
            }
        }

        // Success toast notification
        function showToast(text) {
            const toast = document.getElementById('toast-success');
            const toastText = document.getElementById('toast-text');
            if (!toast || !toastText) return;

            toastText.innerText = text;
            toast.classList.remove('-translate-y-24', 'md:translate-y-24', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.remove('translate-y-0', 'opacity-100');
                toast.classList.add('-translate-y-24', 'md:translate-y-24', 'opacity-0');
            }, 3000);
        }

        // Add to Cart
        function addToCart(dishId, size) {
            const dish = dishes.find(d => d.id === dishId);
            if (!dish) {
                console.error("Prato não encontrado:", dishId);
                return;
            }

            const priceStr = size === 'P' ? dish.priceP : dish.priceG;
            if (!priceStr || priceStr === '—' || priceStr === '') {
                showToast("ESTE TAMANHO NÃO ESTÁ DISPONÍVEL!");
                return;
            }
            const price = parseFloat(priceStr.replace(',', '.'));
            if (isNaN(price) || price <= 0) {
                showToast("PREÇO INVÁLIDO PARA ESTE ITEM!");
                return;
            }

            const key = `${dishId}-${size}`;

            if (cart[key]) {
                cart[key].quantity += 1;
            } else {
                cart[key] = {
                    dishId: dishId,
                    name: dish.name,
                    size: size,
                    price: price,
                    quantity: 1,
                    category: dish.category
                };
            }

            localStorage.setItem('cleanfoods_cart', JSON.stringify(cart));
            updateCartBadges();
            renderCart();

            // Animate floating cart button to draw attention
            const floatingCart = document.getElementById('floating-cart');
            if (floatingCart) {
                floatingCart.classList.add('animate-bounce');
                setTimeout(() => {
                    floatingCart.classList.remove('animate-bounce');
                }, 1000);
            }

            showToast("PRODUTO ADICIONADO AO CARRINHO!");
        }

        // Update Cart Badges count
        function updateCartBadges() {
            let totalItems = 0;
            for (const key in cart) {
                totalItems += cart[key].quantity;
            }

            const badgeHeader = document.getElementById('cart-badge-header');
            const badgeFloat = document.getElementById('cart-badge-float');

            if (badgeHeader) {
                if (totalItems > 0) {
                    badgeHeader.innerText = totalItems;
                    badgeHeader.classList.remove('hidden');
                } else {
                    badgeHeader.classList.add('hidden');
                }
            }

            if (badgeFloat) {
                if (totalItems > 0) {
                    badgeFloat.innerText = totalItems;
                    badgeFloat.classList.remove('hidden');
                } else {
                    badgeFloat.classList.add('hidden');
                }
            }
        }

        // Update Item Quantity inside the cart
        function updateQuantity(key, delta) {
            if (!cart[key]) return;

            cart[key].quantity += delta;
            if (cart[key].quantity <= 0) {
                delete cart[key];
            }

            localStorage.setItem('cleanfoods_cart', JSON.stringify(cart));
            updateCartBadges();
            renderCart();
        }

        // Remove item from cart
        function removeFromCart(key) {
            if (cart[key]) {
                delete cart[key];
                localStorage.setItem('cleanfoods_cart', JSON.stringify(cart));
                updateCartBadges();
                renderCart();
                showToast("ITEM REMOVIDO!");
            }
        }

        // Validate and apply custom coupon codes
        async function applyCartCoupon() {
            const input = document.getElementById('cart-coupon-input');
            const feedback = document.getElementById('coupon-feedback');
            if (!input || !feedback) return;

            const code = input.value.trim().toUpperCase();
            if (!code) {
                feedback.innerText = "Informe o código do cupom!";
                feedback.className = "text-xs font-bold mt-2 text-red-500";
                feedback.classList.remove('hidden');
                appliedCoupon = null;
                renderCart();
                return;
            }

            let coupon = null;
            const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            const todayDay = daysOfWeek[new Date().getDay()];

            if (supabaseClient) {
                try {
                    const { data, error } = await supabaseClient.from('coupons').select('*').eq('code', code);
                    if (error) throw error;
                    if (data && data.length > 0) {
                        coupon = data[0];
                    }
                } catch (err) {
                    console.error("Erro ao verificar cupom no Supabase:", err);
                }
            }

            if (!coupon) {
                const savedCoupons = JSON.parse(localStorage.getItem('cleanfoods_coupons')) || [];
                coupon = savedCoupons.find(c => c.code === code);
            }

            if (!coupon) {
                feedback.innerText = "Cupom inexistente!";
                feedback.className = "text-xs font-bold mt-2 text-red-500";
                feedback.classList.remove('hidden');
                appliedCoupon = null;
                renderCart();
                return;
            }

            if (!coupon.active) {
                feedback.innerText = "Este cupom está desativado!";
                feedback.className = "text-xs font-bold mt-2 text-red-500";
                feedback.classList.remove('hidden');
                appliedCoupon = null;
                renderCart();
                return;
            }

            if (coupon.day !== 'Todo Dia' && coupon.day !== todayDay) {
                feedback.innerText = `Este cupom só é válido de ${coupon.day}!`;
                feedback.className = "text-xs font-bold mt-2 text-red-500";
                feedback.classList.remove('hidden');
                appliedCoupon = null;
                renderCart();
                return;
            }

            // Success
            appliedCoupon = coupon;
            feedback.innerText = `Cupom aplicado! Desconto de ${coupon.discount}%`;
            feedback.className = "text-xs font-bold mt-2 text-green-500";
            feedback.classList.remove('hidden');
            renderCart();
        }

        // Render products list inside the drawer
        function renderCart() {
            const listContainer = document.getElementById('cart-items-list');
            if (!listContainer) return;

            listContainer.innerHTML = '';

            let subtotal = 0;
            let hasItems = false;
            let totalMarmitas = 0; // Combo logic

            for (const key in cart) {
                hasItems = true;
                const item = cart[key];
                totalMarmitas += item.quantity;
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;

                const itemRow = document.createElement('div');
                itemRow.className = 'bg-cf-black p-4 border border-cf-gray rounded flex items-center justify-between gap-3';
                itemRow.innerHTML = `
                    <div class="flex-1">
                        <div class="text-sm font-bold text-white uppercase">${item.name}</div>
                        <div class="text-xs text-gray-400 font-semibold mt-1">Tamanho: <span class="text-cf-yellow">${item.size}</span> | Unitário: R$ ${item.price.toFixed(2).replace('.', ',')}</div>
                        <div class="text-sm font-impact text-cf-yellow mt-1">Total: R$ ${itemTotal.toFixed(2).replace('.', ',')}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="flex items-center bg-cf-darkgray border border-cf-gray rounded overflow-hidden">
                            <button onclick="updateQuantity('${key}', -1)" class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-cf-gray transition-colors text-xs font-bold">-</button>
                            <span class="px-3 py-1 text-sm font-bold text-white select-none">${item.quantity}</span>
                            <button onclick="updateQuantity('${key}', 1)" class="px-2.5 py-1 text-gray-400 hover:text-white hover:bg-cf-gray transition-colors text-xs font-bold">+</button>
                        </div>
                        <button onclick="removeFromCart('${key}')" class="text-red-500 hover:text-red-400 p-1 transition-colors text-sm cursor-hover">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
                listContainer.appendChild(itemRow);
            }

            if (!hasItems) {
                listContainer.innerHTML = `
                    <div class="text-center py-8 text-gray-500 font-semibold italic">
                        Seu carrinho está vazio. Adicione combustível!
                    </div>
                `;
            }

            const subtotalSpan = document.getElementById('cart-subtotal-val');
            const discountRow = document.getElementById('cart-discount-row');
            const discountLabel = document.getElementById('cart-discount-label');
            const discountSpan = document.getElementById('cart-discount-val');
            const totalSpan = document.getElementById('cart-total-val');

            // Combo Progress Logic
            const progressContainer = document.getElementById('combo-progress-container');
            const progressText = document.getElementById('combo-progress-text');
            const progressBar = document.getElementById('combo-progress-bar');
            
            const trackerBanner = document.getElementById('combo-tracker-banner');
            const trackerText = document.getElementById('combo-tracker-text');
            const trackerBar = document.getElementById('combo-tracker-bar');
            
            let comboDiscountPercent = 0;
            let progress = 0;

            let chosenGoal = parseInt(localStorage.getItem('cleanfoods_combo_goal')) || 10;
            
            // Still calculate the real discount based on total items
            if (totalMarmitas >= 30) {
                comboDiscountPercent = 20;
            } else if (totalMarmitas >= 20) {
                comboDiscountPercent = 10;
            } else if (totalMarmitas >= 10) {
                comboDiscountPercent = 5;
            }

            // UI Progress based on Chosen Goal
            let nextGoal = chosenGoal;
            let nextBenefit = "5% OFF";
            if (chosenGoal === 20) nextBenefit = "10% OFF + Salgado";
            if (chosenGoal === 30) nextBenefit = "20% OFF + Frete Grátis";

            let htmlText = "";
            if (totalMarmitas >= chosenGoal) {
                // Goal reached
                htmlText = `🔥 <span class="text-cf-yellow">BÔNUS DESBLOQUEADO:</span> ${nextBenefit} garantido no carrinho!`;
                progress = 100;
            } else {
                htmlText = `Faltam só <span class="text-cf-yellow text-sm md:text-lg mx-1 drop-shadow-[0_0_10px_rgba(246,197,0,0.6)]">${chosenGoal - totalMarmitas}</span> marmitas para liberar <span class="text-cf-yellow border-b border-cf-yellow pb-[1px]">${nextBenefit}</span>!`;
                progress = (totalMarmitas / chosenGoal) * 100;
            }
            
            if (progressText) progressText.innerHTML = htmlText;
            if (trackerText) trackerText.innerHTML = htmlText;

            const isPromoActive = sessionStorage.getItem('cleanfoods_promo_active') === 'true';

            if (progressContainer) {
                if (isPromoActive) {
                    progressContainer.classList.remove('hidden');
                    progressBar.style.width = `${progress}%`;
                    if (!hasItems) progressContainer.classList.add('hidden'); // Hide if empty
                } else {
                    progressContainer.classList.add('hidden');
                }
            }
            
            if (trackerBanner) {
                if (localStorage.getItem('cleanfoods_combo_goal') && isPromoActive) {
                    trackerBanner.classList.remove('hidden');
                    trackerBar.style.width = `${progress}%`;
                } else {
                    trackerBanner.classList.add('hidden');
                }
            }

            let discountAmount = 0;
            let discountLabelText = '';
            let couponDiscountPercent = appliedCoupon ? appliedCoupon.discount : 0;
            
            if (comboDiscountPercent > 0 || couponDiscountPercent > 0) {
                if (comboDiscountPercent >= couponDiscountPercent) {
                    discountAmount = subtotal * (comboDiscountPercent / 100);
                    discountLabelText = `Combo Monstro (${comboDiscountPercent}%)`;
                } else {
                    discountAmount = subtotal * (couponDiscountPercent / 100);
                    discountLabelText = `Cupom (${couponDiscountPercent}%)`;
                }
                
                if (discountRow) discountRow.classList.remove('hidden');
                if (discountLabel) discountLabel.innerText = discountLabelText;
                if (discountSpan) discountSpan.innerText = `-R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
            } else {
                if (discountRow) discountRow.classList.add('hidden');
            }

            let shippingFee = window.systemShippingFee || 0;
            if (totalMarmitas >= 30) shippingFee = 0; // Combo monstro gives frete grátis

            const shippingRow = document.getElementById('cart-shipping-row');
            const shippingSpan = document.getElementById('cart-shipping-val');
            if (shippingRow && shippingSpan) {
                if (shippingFee > 0) {
                    shippingRow.classList.remove('hidden');
                    shippingSpan.innerText = `R$ ${shippingFee.toFixed(2).replace('.', ',')}`;
                } else {
                    shippingRow.classList.add('hidden');
                }
            }

            const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

            if (subtotalSpan) subtotalSpan.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
            if (totalSpan) totalSpan.innerText = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;

            // Checkout Summary Update
            const checkoutList = document.getElementById('checkout-items-list');
            if (checkoutList) {
                checkoutList.innerHTML = '';
                for (const key in cart) {
                    const item = cart[key];
                    const itemRow = document.createElement('div');
                    itemRow.className = 'flex justify-between';
                    itemRow.innerHTML = `
                        <span>${item.quantity}x ${item.name} (${item.size})</span>
                        <span>R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    `;
                    checkoutList.appendChild(itemRow);
                }
            }

            const chkSubtotalSpan = document.getElementById('checkout-subtotal-val');
            const chkDiscountRow = document.getElementById('checkout-discount-row');
            const chkDiscountLabel = document.getElementById('checkout-discount-label');
            const chkDiscountSpan = document.getElementById('checkout-discount-val');
            const chkShippingRow = document.getElementById('checkout-shipping-row');
            const chkShippingSpan = document.getElementById('checkout-shipping-val');
            const chkTotalSpan = document.getElementById('checkout-total-val');

            if (comboDiscountPercent > 0 || couponDiscountPercent > 0) {
                if (chkDiscountRow) chkDiscountRow.classList.remove('hidden');
                if (chkDiscountLabel) chkDiscountLabel.innerText = discountLabelText;
                if (chkDiscountSpan) chkDiscountSpan.innerText = `-R$ ${discountAmount.toFixed(2).replace('.', ',')}`;
            } else {
                if (chkDiscountRow) chkDiscountRow.classList.add('hidden');
            }

            if (chkShippingRow && chkShippingSpan) {
                if (shippingFee > 0) {
                    chkShippingRow.classList.remove('hidden');
                    chkShippingSpan.innerText = `R$ ${shippingFee.toFixed(2).replace('.', ',')}`;
                } else {
                    chkShippingRow.classList.add('hidden');
                }
            }

            if (chkSubtotalSpan) chkSubtotalSpan.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
            if (chkTotalSpan) chkTotalSpan.innerText = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
        }

        // Toggle Checkout Modal
        function toggleCheckoutModal() {
            const modal = document.getElementById('checkout-modal');
            if (!modal) return;

            if (modal.classList.contains('hidden')) {
                // Pre-fill inputs from localStorage if saved
                const savedName = localStorage.getItem('cleanfoods_client_name') || '';
                const savedPhone = localStorage.getItem('cleanfoods_client_phone') || '';
                const savedAddress = localStorage.getItem('cleanfoods_client_address') || '';

                const nameInput = document.getElementById('client-name');
                const phoneInput = document.getElementById('client-phone');
                const addressTextarea = document.getElementById('client-address');

                if (nameInput) nameInput.value = savedName;
                if (phoneInput) phoneInput.value = savedPhone;
                if (addressTextarea) addressTextarea.value = savedAddress;

                // Dynamically set delivery date bounds
                const dateInput = document.getElementById('delivery-date');
                if (dateInput) {
                    const getLocalDateString = (date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                    };
                    const today = new Date();
                    const minDate = getLocalDateString(today);
                    const nextWeek = new Date();
                    nextWeek.setDate(today.getDate() + 7);
                    const maxDate = getLocalDateString(nextWeek);
                    dateInput.min = minDate;
                    dateInput.max = maxDate;
                    dateInput.value = minDate; // default to today
                }

                modal.classList.remove('hidden');
                document.body.classList.add('cart-open-overflow');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                }, 10);
            } else {
                modal.classList.add('opacity-0');
                document.body.classList.remove('cart-open-overflow');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            }
        }

        // Close Thank You Modal
        function closeThankYouModal() {
            const thankModal = document.getElementById('thank-you-modal');
            if (thankModal) {
                thankModal.classList.add('opacity-0');
                setTimeout(() => {
                    thankModal.classList.add('hidden');
                }, 300);
            }
            document.body.classList.remove('cart-open-overflow');
        }

        // Validate checkout modal fields and submit order locally
        let isSubmitting = false;
        async function submitCheckoutForm() {
            if (isSubmitting) return;
            const nameInput = document.getElementById('client-name');
            const phoneInput = document.getElementById('client-phone');
            const addressInput = document.getElementById('client-address');
            
            const notesInput = document.getElementById('client-notes');
            const dateInput = document.getElementById('delivery-date');
            const timeInput = document.getElementById('delivery-time');

            const name = nameInput ? nameInput.value.trim() : '';
            const phone = phoneInput ? phoneInput.value.trim() : '';
            const address = addressInput ? addressInput.value.trim() : '';
            let payment = 'Aguardando';
            const notes = notesInput ? notesInput.value.trim() : '';
            const deliveryDate = dateInput ? dateInput.value : '';
            const deliveryTime = timeInput ? timeInput.value : '';

            if (!name) {
                alert("Por favor, preencha o campo Nome Completo.");
                if (nameInput) nameInput.focus();
                return;
            }
            if (!phone) {
                alert("Por favor, preencha o campo Telefone.");
                if (phoneInput) phoneInput.focus();
                return;
            }
            if (!address) {
                alert("Por favor, preencha o campo Endereço de Entrega.");
                if (addressInput) addressInput.focus();
                return;
            }
            if (!payment) {
                alert("Por favor, escolha uma Forma de Pagamento.");
                if (paymentInput) paymentInput.focus();
                return;
            }
            if (!deliveryDate) {
                alert("Por favor, selecione a Data da Entrega.");
                if (dateInput) dateInput.focus();
                return;
            }
            if (!deliveryTime) {
                alert("Por favor, informe o Horário da Entrega.");
                if (timeInput) timeInput.focus();
                return;
            }

            // Validar formato do telefone (mínimo 10 dígitos)
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 11) {
                alert("Informe um telefone válido com DDD (ex: 11999998888)");
                if (phoneInput) phoneInput.focus();
                return;
            }

            // Validar horário (11:00 às 19:00)
            const [hours, minutes] = deliveryTime.split(':').map(Number);
            if (hours < 11 || (hours === 19 && minutes > 0) || hours > 19) {
                alert("O horário de entrega deve ser entre 11h e 19h.");
                if (timeInput) timeInput.focus();
                return;
            }

            // Validar data da entrega (de hoje até hoje + 7 dias)
            const selectedDate = new Date(deliveryDate + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const maxDate = new Date(today);
            maxDate.setDate(today.getDate() + 7);

            if (selectedDate < today || selectedDate > maxDate) {
                alert("A data de entrega deve ser a partir de hoje e no máximo nos próximos 7 dias.");
                if (dateInput) dateInput.focus();
                return;
            }

            isSubmitting = true;

            localStorage.setItem('cleanfoods_client_name', name);
            localStorage.setItem('cleanfoods_client_phone', phone);
            localStorage.setItem('cleanfoods_client_address', address);

            let subtotal = 0;
            let totalMarmitas = 0;
            const orderItems = [];
            for (const key in cart) {
                const item = cart[key];
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                totalMarmitas += item.quantity;
                orderItems.push({
                    name: item.name,
                    size: item.size,
                    price: item.price,
                    quantity: item.quantity
                });
            }

            let comboDiscountPercent = 0;
            let comboBonus = '';
            if (totalMarmitas >= 30) {
                comboDiscountPercent = 20;
                comboBonus = 'Frete Grátis';
            } else if (totalMarmitas >= 20) {
                comboDiscountPercent = 10;
                comboBonus = '1 Salgado Cortesia';
            } else if (totalMarmitas >= 10) {
                comboDiscountPercent = 5;
            }

            if (comboBonus) {
                orderItems.push({
                    name: `🎁 BRINDE: ${comboBonus}`,
                    size: 'Único',
                    price: 0,
                    quantity: 1
                });
            }

            // Revalidar cupom antes de aplicar
            if (appliedCoupon) {
                const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
                const todayDay = daysOfWeek[new Date().getDay()];
                if (!appliedCoupon.active || (appliedCoupon.day !== 'Todo Dia' && appliedCoupon.day !== todayDay)) {
                    appliedCoupon = null;
                }
            }

            let couponDiscountPercent = appliedCoupon ? appliedCoupon.discount : 0;
            let discountAmount = 0;
            
            if (comboDiscountPercent >= couponDiscountPercent) {
                discountAmount = subtotal * (comboDiscountPercent / 100);
            } else {
                discountAmount = subtotal * (couponDiscountPercent / 100);
            }
            
            let shippingFee = window.systemShippingFee || 0;
            if (totalMarmitas >= 30) {
                shippingFee = 0;
            }

            const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

            if (shippingFee > 0) {
                orderItems.push({
                    name: `🚚 Frete`,
                    size: 'Único',
                    price: shippingFee,
                    quantity: 1
                });
            }

            const orderId = 'CF-' + Date.now().toString(36).slice(-5).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

            const order = {
                id: orderId,
                clientName: name,
                clientPhone: phone,
                address: address,
                payment: payment,
                notes: notes,
                deliveryDate: deliveryDate,
                deliveryTime: deliveryTime,
                items: orderItems,
                subtotal: subtotal.toFixed(2),
                discount: discountAmount.toFixed(2),
                total: finalTotal.toFixed(2),
                status: 'Pendente',
                date: new Date().toISOString()
            };

            // ------------------ NEW FLOW ------------------
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
                const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : order.deliveryDate;
                orderDeliverySpan.innerText = `${formattedDate} às ${order.deliveryTime}`;
            }

            const pixInfoContainer = document.getElementById('pix-payment-info');
            if (paymentMethod === 'Pix') {
                if (mpResponse && mpResponse.point_of_interaction) {
                    const qrCodeBase64 = mpResponse.point_of_interaction.transaction_data.qr_code_base64;
                    const qrCodeString = mpResponse.point_of_interaction.transaction_data.qr_code;
                    document.getElementById('pix-qr-code').src = `data:image/jpeg;base64,${qrCodeBase64}`;
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
                        email: order.clientName.replace(/\s+/g, '').toLowerCase() + '@cleanfoods.com',
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
                        formData.description = `Pedido ${order.id} - ${order.clientName}`;
                        formData.external_reference = order.id;
                        
                        return new Promise((resolve, reject) => {
                            fetch(`${window.SUPABASE_URL}/functions/v1/create-payment`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${window.SUPABASE_ANON_KEY}`
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


        function checkoutOrder() {
            let hasItems = false;
            for (const key in cart) {
                hasItems = true;
                break;
            }

            if (!hasItems) {
                alert("Adicione pelo menos um item ao seu carrinho!");
                return;
            }

            toggleCart();
            toggleCheckoutModal();
        }

        // Filtering Logic
        function filterCategory(category) {
            activeCategory = category;

            // Highlight active button
            const categories = ['Todos', 'Frango', 'Patinho', 'Gourmet', 'Salgados'];
            categories.forEach(cat => {
                const btn = document.getElementById('filter-btn-' + cat);
                if (btn) {
                    if (cat === category) {
                        btn.className = "bg-cf-yellow text-cf-black font-impact tracking-wider px-6 py-3 border-2 border-cf-yellow hover:bg-white hover:text-cf-black hover:border-white transition-all uppercase text-base rounded-sm cursor-hover shadow-lg";
                    } else {
                        btn.className = "bg-cf-darkgray text-white font-impact tracking-wider px-6 py-3 border-2 border-cf-gray hover:bg-cf-yellow hover:text-cf-black hover:border-cf-yellow transition-all uppercase text-base rounded-sm cursor-hover shadow-lg";
                    }
                }
            });

            renderDishesGrid();
        }

        // Render Dishes in Grid
        function renderDishesGrid() {
            const grid = document.getElementById('dishes-grid');
            if (!grid) return;

            grid.innerHTML = '';

            let filteredDishes = activeCategory === 'Todos'
                ? dishes
                : dishes.filter(d => d.category === activeCategory);

            filteredDishes = filteredDishes.filter(d => d.available !== false);

            if (filteredDishes.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full text-center py-12 text-gray-500 font-semibold italic">
                        Nenhum prato disponível nesta categoria.
                    </div>
                `;
                return;
            }

            filteredDishes.forEach(dish => {
                const placeholderImg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23666%22%3E%3Cpath d=%22M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z%22/%3E%3C/svg%3E';
                const imgSrc = dish.image || placeholderImg;

                const card = document.createElement('div');
                card.className = "bg-cf-darkgray border border-cf-yellow rounded-lg overflow-hidden flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-300 shadow-xl cursor-hover group";

                let groupLabel = 'Linha ' + dish.category;
                if (dish.category === 'Gourmet') groupLabel = 'Linha Gourmet';
                if (dish.category === 'Salgados') groupLabel = 'Salgados Fitness';

                let priceP_HTML = '';
                if (dish.priceP && dish.priceP !== '—' && dish.priceP !== '') {
                    priceP_HTML = `<span class="text-gray-400">P <span class="text-white bg-cf-gray px-2.5 py-1 rounded-sm ml-1.5 cursor-pointer hover:bg-cf-yellow hover:text-cf-black transition-all inline-flex items-center gap-1" onclick="addToCart('${dish.id}', 'P')">R$ ${dish.priceP} <i class="fa-solid fa-plus text-[10px]"></i></span></span>`;
                } else {
                    priceP_HTML = `<span class="text-gray-500">P <span class="text-gray-600 bg-cf-darkgray border border-gray-800 px-2.5 py-1 rounded-sm ml-1.5 cursor-not-allowed inline-flex items-center gap-1">—</span></span>`;
                }

                let priceG_HTML = '';
                if (dish.priceG && dish.priceG !== '—' && dish.priceG !== '') {
                    priceG_HTML = `<span class="text-cf-yellow ml-2">G <span class="bg-cf-yellow text-cf-black px-2.5 py-1 rounded-sm ml-1.5 cursor-pointer hover:bg-white hover:text-cf-black transition-all inline-flex items-center gap-1" onclick="addToCart('${dish.id}', 'G')">R$ ${dish.priceG} <i class="fa-solid fa-plus text-[10px]"></i></span></span>`;
                } else {
                    priceG_HTML = `<span class="text-gray-500 ml-2">G <span class="text-gray-600 bg-cf-darkgray border border-gray-800 px-2.5 py-1 rounded-sm ml-1.5 cursor-not-allowed inline-flex items-center gap-1">—</span></span>`;
                }

                card.innerHTML = `
                    <div class="h-48 bg-cf-black overflow-hidden relative border-b-4 border-cf-yellow cursor-pointer group-hover:opacity-90" onclick="openDishDetail('${dish.id}')">
                        <img src="${imgSrc}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute top-3 left-3 bg-cf-yellow text-cf-black text-[10px] uppercase font-bold px-2 py-1 rounded shadow pointer-events-none">${groupLabel}</div>
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                            <i class="fa-solid fa-magnifying-glass-plus text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity transform scale-50 group-hover:scale-100 duration-300"></i>
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex flex-col justify-between">
                        <h4 class="font-impact text-2xl text-white uppercase mb-4">${dish.name}</h4>
                        <div class="flex justify-between items-center text-sm font-semibold pt-4 border-t border-gray-800 mt-auto">
                            ${priceP_HTML}
                            ${priceG_HTML}
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        // Dish Detail Modal Functions
        function openDishDetail(dishId) {
            const dish = dishes.find(d => d.id === dishId);
            if (!dish) return;

            const placeholderImg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23666%22%3E%3Cpath d=%22M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z%22/%3E%3C/svg%3E';
            const imgEl = document.getElementById('dish-detail-img');
            imgEl.src = dish.image || placeholderImg;

            document.getElementById('dish-detail-category').innerText = dish.category === 'Gourmet' ? 'Linha Gourmet' : 'Linha ' + dish.category;
            document.getElementById('dish-detail-name').innerText = dish.name;

            const pContainer = document.getElementById('dish-detail-p');
            if (dish.priceP && dish.priceP !== '—' && dish.priceP !== '') {
                pContainer.innerHTML = `<span class="text-gray-400 font-bold">P (225g)</span>
                    <button onclick="addToCart('${dish.id}', 'P'); closeDishDetail();" class="text-white bg-cf-gray px-4 py-2 rounded-sm cursor-pointer hover:bg-cf-yellow hover:text-cf-black transition-all font-bold text-sm inline-flex items-center gap-2">R$ ${dish.priceP} <i class="fa-solid fa-cart-plus"></i></button>`;
            } else {
                pContainer.innerHTML = `<span class="text-gray-500 font-bold">P (225g)</span><span class="text-gray-600 font-bold text-sm">—</span>`;
            }

            const gContainer = document.getElementById('dish-detail-g');
            if (dish.priceG && dish.priceG !== '—' && dish.priceG !== '') {
                gContainer.innerHTML = `<span class="text-cf-yellow font-bold">G (450g)</span>
                    <button onclick="addToCart('${dish.id}', 'G'); closeDishDetail();" class="bg-cf-yellow text-cf-black px-4 py-2 rounded-sm cursor-pointer hover:bg-white hover:text-cf-black transition-all font-bold text-sm inline-flex items-center gap-2">R$ ${dish.priceG} <i class="fa-solid fa-cart-plus"></i></button>`;
            } else {
                gContainer.innerHTML = `<span class="text-gray-500 font-bold">G (450g)</span><span class="text-gray-600 font-bold text-sm">—</span>`;
            }

            const n = dish.nutrition || {...defaultNutrition};
            document.getElementById('det-energy').innerText = n.energy || '-';
            document.getElementById('det-carbs').innerText = n.carbs || '-';
            document.getElementById('det-proteins').innerText = n.proteins || '-';
            document.getElementById('det-total-fat').innerText = n.totalFat || '-';
            document.getElementById('det-sat-fat').innerText = n.saturatedFat || '-';
            document.getElementById('det-trans-fat').innerText = n.transFat || '-';
            document.getElementById('det-fiber').innerText = n.fiber || '-';
            document.getElementById('det-sodium').innerText = n.sodium || '-';

            // Ensure accordion is closed when opening new dish
            const nutriContent = document.getElementById('nutrition-content');
            const nutriIcon = document.getElementById('nutrition-icon');
            if(nutriContent) nutriContent.classList.add('hidden');
            if(nutriIcon) nutriIcon.classList.remove('rotate-180');

            const modal = document.getElementById('dish-detail-modal');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
            }, 10);
        }

        function closeDishDetail() {
            const modal = document.getElementById('dish-detail-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        function toggleNutrition() {
            const content = document.getElementById('nutrition-content');
            const icon = document.getElementById('nutrition-icon');
            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                icon.classList.add('rotate-180');
            } else {
                content.classList.add('hidden');
                icon.classList.remove('rotate-180');
            }
        }

        function openComboModal() {
            const modal = document.getElementById('combo-promo-modal');
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
            }, 10);
        }

        function selectComboGoal(goal) {
            localStorage.setItem('cleanfoods_combo_goal', goal);
            sessionStorage.setItem('cleanfoods_promo_active', 'true');
            closeComboModal();
            renderCart();
            updateTicketHighlight(goal);
            // Optional: Provide feedback toast
            const toast = document.getElementById('toast-success');
            const toastText = document.getElementById('toast-text');
            if (toast && toastText) {
                toastText.innerText = `OBJETIVO DEFINIDO: ${goal} MARMITAS!`;
                toast.classList.remove('opacity-0', 'pointer-events-none');
                toast.classList.add('opacity-100');
                if (window.innerWidth < 768) {
                    toast.classList.replace('-translate-y-24', 'translate-y-4');
                } else {
                    toast.classList.replace('translate-y-24', '-translate-y-6');
                }
                setTimeout(() => {
                    toast.classList.remove('opacity-100');
                    toast.classList.add('opacity-0', 'pointer-events-none');
                    if (window.innerWidth < 768) {
                        toast.classList.replace('translate-y-4', '-translate-y-24');
                    } else {
                        toast.classList.replace('-translate-y-6', 'translate-y-24');
                    }
                }, 3000);
            }
        }

        function closeComboModal() {
            const modal = document.getElementById('combo-promo-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        function updateTicketHighlight(selectedGoal) {
            if (!selectedGoal) return;
            [10, 20, 30].forEach(goal => {
                const ticket = document.getElementById(`promo-ticket-${goal}`);
                const action = document.getElementById(`promo-ticket-action-${goal}`);
                if (!ticket || !action) return;

                if (goal === parseInt(selectedGoal)) {
                    ticket.classList.add('ring-[6px]', 'ring-white', 'scale-105', 'z-20', 'shadow-[0_0_30px_rgba(255,255,255,0.6)]');
                    action.innerHTML = `<i class="fa-solid fa-check text-cf-yellow"></i><span class="text-cf-yellow">ATIVO</span>`;
                    action.classList.remove('text-cf-black', 'opacity-70');
                    action.classList.add('bg-[#1a1a1a]', 'text-cf-yellow', 'opacity-100', '-mx-2', '-mb-2', 'px-2', 'pb-3', 'pt-3', 'rounded-b-sm');
                } else {
                    ticket.classList.remove('ring-[6px]', 'ring-white', 'scale-105', 'z-20', 'shadow-[0_0_30px_rgba(255,255,255,0.6)]');
                    action.innerHTML = `<i class="fa-solid fa-ticket hidden md:inline-block"></i><span>Selecionar</span>`;
                    action.classList.remove('bg-[#1a1a1a]', 'text-cf-yellow', 'opacity-100', '-mx-2', '-mb-2', 'px-2', 'pb-3', 'pt-3', 'rounded-b-sm');
                    action.classList.add('text-cf-black', 'opacity-70');
                }
            });
        }

        window.onload = function () {
            // Handle Payment Return
            const urlParams = new URLSearchParams(window.location.search);
            const status = urlParams.get('status');
            const order_id = urlParams.get('order_id');
            
            if (status === 'success' || status === 'pending') {
                const pendingOrder = JSON.parse(localStorage.getItem('cleanfoods_pending_order'));
                if (pendingOrder && pendingOrder.id === order_id) {
                    const orderIdSpan = document.getElementById('thank-order-id');
                    const orderTotalSpan = document.getElementById('thank-order-total');
                    const orderPaymentSpan = document.getElementById('thank-order-payment');
                    const orderDeliverySpan = document.getElementById('thank-order-delivery');

                    if (orderIdSpan) orderIdSpan.innerText = '#' + pendingOrder.id;
                    if (orderTotalSpan) orderTotalSpan.innerText = 'R$ ' + pendingOrder.total.replace('.', ',');
                    if (orderPaymentSpan) orderPaymentSpan.innerText = pendingOrder.payment;
                    if (orderDeliverySpan) {
                        const parts = pendingOrder.deliveryDate.split('-');
                        const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : pendingOrder.deliveryDate;
                        orderDeliverySpan.innerText = `${formattedDate} às ${pendingOrder.deliveryTime}`;
                    }

                    const thankModal = document.getElementById('thank-you-modal');
                    if (thankModal) {
                        thankModal.classList.remove('hidden');
                        setTimeout(() => {
                            thankModal.classList.remove('opacity-0');
                        }, 10);
                    }
                    
                    // Clear the cart
                    cart = {};
                    localStorage.setItem('cleanfoods_cart', JSON.stringify(cart));
                    localStorage.removeItem('cleanfoods_pending_order');
                    
                    // Remove url params
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else if (status === 'failure') {
                alert('Ocorreu um erro no pagamento ou ele foi recusado. Por favor, tente novamente.');
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Render dishes instantly from cache or defaults
            dishes = JSON.parse(localStorage.getItem('cleanfoods_dishes_v2')) || defaultDishes;
            renderDishesGrid();

            // Trigger GSAP reveal animations immediately
            gsap.from(".reveal-up", {
                duration: 1,
                y: 30,
                opacity: 0,
                stagger: 0.2,
                ease: "power2.out"
            });

            // Load fresh data from Supabase in background
            loadDishes().then(() => {
                renderDishesGrid();
                localStorage.setItem('cleanfoods_dishes_v2', JSON.stringify(dishes));
            });

            // Load other configs asynchronously
            loadSettings();
            loadCoupons();
            updateCartBadges();
            
            const storedGoal = localStorage.getItem('cleanfoods_combo_goal');
            if (storedGoal) {
                updateTicketHighlight(storedGoal);
            }
            
            renderCart();

            // Check URL for Promo Code
            urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('promo') === 'combo') {
                setTimeout(openComboModal, 800);
            } else if (urlParams.get('promo') === 'active') {
                sessionStorage.setItem('cleanfoods_promo_active', 'true');
                renderCart(); // re-render to show banners immediately if they were hidden
            }
        };
    
