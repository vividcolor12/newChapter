import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'out', 'dom-snapshot.html'), 'utf8');
const m = html.match(/data-page="([^"]+)"/);
if (!m) {
  console.error('no data-page');
  process.exit(1);
}
const raw = m[1]
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const data = JSON.parse(raw);
const card = data.props.mCard;
fs.writeFileSync(path.join(root, 'out', 'card-props.json'), JSON.stringify(card, null, 2));
console.log('keys', Object.keys(card));
console.log('basicInfo keys', Object.keys(card.basicInfo || {}));
console.log('weddingDate', card.basicInfo?.weddingDate || card.weddingDate);
console.log('male', card.basicInfo?.maleFamilyName, card.basicInfo?.maleGivenName);
console.log('female', card.basicInfo?.femaleFamilyName, card.basicInfo?.femaleGivenName);
