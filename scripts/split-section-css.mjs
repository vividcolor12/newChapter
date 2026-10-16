import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(path.resolve(__dirname, '..'), 'out', 'sections');

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.css') && !f.startsWith('_') && !f.includes('.own.'));
const sets = files.map((f) => new Set(fs.readFileSync(path.join(DIR, f), 'utf8').split('\n')));
const common = [...sets[0]].filter((line) => sets.every((s) => s.has(line)));
fs.writeFileSync(path.join(DIR, '_common.css'), common.join('\n'));

files.forEach((f, i) => {
  const own = [...sets[i]].filter((line) => !common.includes(line) && !/theme_emp_color_(?!purple)|bg_theme_(?!white)|bg_theme_dark|\.ft-(?!gowundodum)|yeonsung|twindround/.test(line));
  fs.writeFileSync(path.join(DIR, f.replace('.css', '.own.css')), own.join('\n'));
  console.log(f, 'own rules', own.length);
});
console.log('common', common.length);
