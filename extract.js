const fs = require('fs');
const content = fs.readFileSync('cardapio-completo.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let scripts = '';
while ((match = scriptRegex.exec(content)) !== null) {
    scripts += match[1] + '\n';
}
fs.writeFileSync('test.js', scripts);
