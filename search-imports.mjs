import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function searchInDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      searchInDirectory(filePath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('isSupabaseConfigured')) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('isSupabaseConfigured')) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  return results;
}

const results = searchInDirectory(path.join(__dirname, 'src'));
console.log('\n🔍 FICHIERS CONTENANT "isSupabaseConfigured":\n');
if (results.length === 0) {
  console.log('✅ Aucune occurrence trouvée!');
} else {
  results.forEach(r => {
    console.log(`📄 ${r.file}:${r.line}`);
    console.log(`   ${r.content}\n`);
  });
}
