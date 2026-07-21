const fs = require('fs');
let content = fs.readFileSync('db/seed.sql', 'utf8');
content = content.replace(/INV\/2026\/06\//g, 'INV-2026-06-');
content = content.replace(/PO\/2026\/06\//g, 'PO-2026-06-');
content = content.replace(/'PO\/\{YYYY\}\/\{MM\}\/'/g, "'PO-{YYYY}-{MM}-'");
content = content.replace(/'INV\/\{YYYY\}\/\{MM\}\/'/g, "'INV-{YYYY}-{MM}-'");
fs.writeFileSync('db/seed.sql', content);
