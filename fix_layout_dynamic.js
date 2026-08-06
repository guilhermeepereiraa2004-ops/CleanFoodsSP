const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const lines = html.split('\n');

let startIndex = -1;
let endIndex = -1;
let mainCloseIndex = -1;
let mainRogueIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('TAB: FINANCEIRO')) startIndex = i;
    if (lines[i].trim() === '</div>' && i > 1150 && endIndex === -1) {
        // Find the last </div> before the rogue </main>
    }
    if (lines[i].includes('</main>') && i < 1000) mainCloseIndex = i;
    if (lines[i].includes('</main>') && i > 1100) mainRogueIndex = i;
}

// Find the last </div> for tab-clientes before mainRogueIndex
for(let i = mainRogueIndex - 1; i > startIndex; i--) {
    if (lines[i].includes('</div>')) {
        endIndex = i;
        break;
    }
}

if (startIndex === -1 || endIndex === -1 || mainCloseIndex === -1 || mainRogueIndex === -1) {
    console.error("Could not find all required markers:", {startIndex, endIndex, mainCloseIndex, mainRogueIndex});
    process.exit(1);
}

console.log(`Found markers: start=${startIndex}, end=${endIndex}, mainClose=${mainCloseIndex}, mainRogue=${mainRogueIndex}`);

// The rogue tags to remove: lines at mainRogueIndex and mainRogueIndex+1 (which should be </div>)
// Let's verify:
if (!lines[mainRogueIndex+1].includes('</div>')) {
    console.log("Warning: rogue </main> is not immediately followed by </div>");
}

const extractedTabs = lines.slice(startIndex, endIndex + 1);

// Remove the rogue tags (from mainRogueIndex to mainRogueIndex+1)
lines.splice(mainRogueIndex, 2);

// Remove the extracted tabs
lines.splice(startIndex, endIndex - startIndex + 1);

// The new mainCloseIndex after splicing out things that come AFTER it? 
// No, startIndex > mainCloseIndex, so mainCloseIndex is unaffected.

// Insert the extracted tabs right before mainCloseIndex
lines.splice(mainCloseIndex, 0, ...extractedTabs);

fs.writeFileSync('admin.html', lines.join('\n'));
console.log("Restructuring successful!");
