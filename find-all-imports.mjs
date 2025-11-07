import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function searchInDirectory(dir, results = [], depth = 0) {
  if (depth > 10) return results; // Limite de profondeur
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      try {
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
            searchInDirectory(filePath, results, depth + 1);
          }
        } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('isSupabaseConfigured')) {
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes('isSupabaseConfigured')) {
                results.push({
                  file: filePath.replace(__dirname + '/', ''),
                  line: index + 1,
                  content: line.trim()
                });
              }
            });
          }
        }
      } catch (err) {
        // Ignorer les erreurs de fichiers individuels
      }
    }
  } catch (err) {
    console.error(`Erreur lecture ${dir}:`, err.message);
  }
  
  return results;
}

console.log('\n🔍 RECHERCHE EXHAUSTIVE de "isSupabaseConfigured"...\n');
const results = searchInDirectory(__dirname);

if (results.length === 0) {
  console.log('✅ Aucune occurrence trouvée!\n');
} else {
  console.log(`❌ ${results.length} occurrence(s) trouvée(s):\n`);
  results.forEach(r => {
    console.log(`📄 ${r.file}:${r.line}`);
    console.log(`   ${r.content}\n`);
  });
}
