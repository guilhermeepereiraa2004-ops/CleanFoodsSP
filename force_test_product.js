const fs = require('fs');

['index.html', 'cardapio-completo.html'].forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    
    // Find the end of loadDishes before renderMenu()
    const injectPoint = `if (typeof renderMenu === 'function') renderMenu();`;
    const injection = `
            const testDish = { id: 'price-teste-vr', name: 'Teste (Produto para Homologação VR)', category: 'Frango', priceP: '2,00', priceG: '2,00' };
            if (typeof dishes !== 'undefined' && !dishes.find(d => d.id === testDish.id)) {
                dishes.unshift(testDish);
            }
            `;
            
    if (content.includes(injectPoint) && !content.includes('price-teste-vr\', name: \'Teste')) {
        content = content.replace(injectPoint, injection + injectPoint);
        fs.writeFileSync(f, content, 'utf8');
        console.log('Injected test product before renderMenu in ' + f);
    } else {
        console.log('Skipping ' + f + ' (already injected or inject point not found)');
    }
});
