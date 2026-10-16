import fs from 'fs';

const jsx = fs.readFileSync('out/missing/flower.popup.jsx.txt', 'utf8');
const lines = jsx.trimEnd().split('\n').map((l) => `  ${l}`).join('\n');
fs.writeFileSync('src/origin/popups/FlowerPopup.jsx', `export default function FlowerPopup() {\n  return (\n${lines}\n  );\n}\n`);
fs.copyFileSync('out/missing/drawer.html', 'src/origin/popups/drawer.html');
