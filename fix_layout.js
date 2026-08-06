const fs = require('fs');
const html = fs.readFileSync('admin.html', 'utf8');
const lines = html.split('\n');

// The ranges we want to move
// Note: array indices are 0-based.
// Line 1024 is index 1023.

const startIndex = 1023; // Line 1024 <!-- TAB: FINANCEIRO -->
let endIndex = 1155;     // Line 1156 (end of tab-clientes)

// Let's verify the contents to be safe
if (!lines[startIndex].includes('TAB: FINANCEIRO') || !lines[endIndex].includes('</div>')) {
    console.error("Mismatch in lines! Check indices.");
    process.exit(1);
}

// Extract the tabs
const extractedTabs = lines.slice(startIndex, endIndex + 1);

// Remove the extracted tabs and the rogue </main> </div> that follow them
// The rogue tags are at line 1157 and 1158 (indices 1156 and 1157)
// So we remove from startIndex to 1157.
lines.splice(startIndex, (1157 - startIndex + 1));

// Now insert `extractedTabs` right before the `</main>` at line 643.
// Wait, the indices have shifted if we removed them before inserting?
// We removed from 1023 onwards, which is AFTER 642, so the index 642 is unchanged.
// Line 643 is `        </main>`, which is index 642.
// Let's verify:
if (!lines[642].includes('</main>')) {
    console.error("Mismatch at line 643! Expected </main>");
    process.exit(1);
}

// Insert the tabs BEFORE line 643 (index 642)
lines.splice(642, 0, ...extractedTabs);

fs.writeFileSync('admin.html', lines.join('\n'));
console.log("Restructuring successful!");
