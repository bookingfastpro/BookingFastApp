const fs = require('fs');
const path = require('path');

function searchInDirectory(dir, pattern) {
  const results = [];
  
  function walk(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
          walk(filePath);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(pattern)) {
          results.push(filePath);
        }
      }
    }
  }
  
  walk(dir);
  return results;
}

const pattern = 'isSupabaseConfigured';
const results = searchInDirectory('./src', pattern);

if (results.length === 0) {
  console.log('✅ Aucune référence à "isSupabaseConfigured" trouvée !');
} else {
  console.log(`❌ Trouvé ${results.length} fichier(s) avec "${pattern}":\n`);
  results.forEach(file => console.log(`  - ${file}`));
}
