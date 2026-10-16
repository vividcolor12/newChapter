import fs from 'fs';

const norm = (s) => s.replace(/ data-probe-id="[^"]*"/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
const comp = (name) => norm(fs.readFileSync(`src/origin/${name}.jsx`, 'utf8'));

function diff(id, name) {
  const a = comp(name);
  const b = norm(fs.readFileSync(`out/interactions/${id}.block.jsx.txt`, 'utf8'));
  const setA = new Set(a);
  const setB = new Set(b);
  const added = b.filter((l) => !setA.has(l));
  const removed = a.filter((l) => !setB.has(l) && !/^(import|export|return|\)|\}|\/\/)/.test(l));
  console.log(`=== ${id} vs ${name}: +${added.length} -${removed.length}`);
  const max = Number(process.env.MAX || 12);
  for (const l of removed.slice(0, max)) console.log('  -', l.slice(0, 220));
  for (const l of added.slice(0, max)) console.log('  +', l.slice(0, 220));
}

for (const [id, name] of process.argv.slice(2).map((s) => s.split(':'))) diff(id, name);
