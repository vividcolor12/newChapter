import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BLOCK_DIR = path.join(ROOT, 'src', 'origin');

export function convertInPage(targetSelector) {
  const PHOTO_RE = /https:\/\/images\.theirmood\.com\/resources\/46097\/card\/vzUGuBO4E1\/([A-Za-z0-9]+)\.png(\?[^"')\s]*)?/g;
  const ATTR_MAP = {
    class: 'className', for: 'htmlFor', tabindex: 'tabIndex', readonly: 'readOnly', maxlength: 'maxLength',
    srcset: 'srcSet', crossorigin: 'crossOrigin', autocomplete: 'autoComplete', frameborder: 'frameBorder',
    allowfullscreen: 'allowFullScreen', colspan: 'colSpan', rowspan: 'rowSpan', viewbox: 'viewBox',
    'xmlns:xlink': 'xmlnsXlink', 'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', contenteditable: 'contentEditable',
    spellcheck: 'spellCheck', unselectable: 'unselectable', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint',
  };
  const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'wbr']);
  const photos = {};

  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const jsxAttrName = (n) => {
    if (ATTR_MAP[n]) return ATTR_MAP[n];
    if (n.startsWith('data-') || n.startsWith('aria-')) return n;
    if (n.includes(':')) return camel(n.replace(':', '-'));
    if (n.includes('-')) return camel(n);
    return n;
  };
  const photoExpr = (str) => {
    let used = false;
    const out = str.replace(PHOTO_RE, (m, id, q = '') => {
      used = true;
      photos[id] = photos[id] || m.split('?')[0];
      return `\${photo('${id}', '${q}')}`;
    });
    return used ? '`' + out.replace(/`/g, '\\`') + '`' : null;
  };
  const strValue = (v) => {
    const p = photoExpr(v);
    return p ? `{${p}}` : JSON.stringify(v);
  };
  const styleObj = (css) => {
    const parts = [];
    css.split(/;(?![^(]*\))/).forEach((decl) => {
      const i = decl.indexOf(':');
      if (i < 0) return;
      let prop = decl.slice(0, i).trim();
      const val = decl.slice(i + 1).trim().replace(/\s*!important$/, '');
      if (!prop) return;
      prop = prop.startsWith('--') ? JSON.stringify(prop) : camel(prop.replace(/^-webkit-/, 'webkit-').replace(/^-ms-/, 'ms-'));
      const p = photoExpr(val);
      parts.push(`${prop}: ${p || JSON.stringify(val)}`);
    });
    return `{{ ${parts.join(', ')} }}`;
  };

  const emit = (node, depth, ctx) => {
    const pad = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent;
      if (!t) return '';
      if (!t.trim() && !t.includes('\u00a0')) return ctx.pre ? `${pad}{${JSON.stringify(t)}}\n` : '';
      return `${pad}{${JSON.stringify(t)}}\n`;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || el.classList.contains('popup-stack')) return '';
    const attrs = [];
    for (const a of el.attributes) {
      if (a.name === 'data-probe') continue;
      let v = a.value;
      if (a.name === 'class') v = v.split(/\s+/).filter((c) => c && c !== 'aos-animate').join(' ');
      if ((a.name === 'src' || a.name === 'href') && v && !/^(https?:|data:|tel:|sms:|mailto:|#|javascript:)/.test(v)) {
        v = new URL(v, location.href).href;
      }
      if (a.name === 'style') { attrs.push(`style=${styleObj(v)}`); continue; }
      if (tag === 'input' && a.name === 'value') { attrs.push(`defaultValue=${strValue(v)}`); continue; }
      if (tag === 'input' && a.name === 'checked') { attrs.push('defaultChecked'); continue; }
      if (['disabled', 'readonly', 'multiple', 'hidden', 'required', 'allowfullscreen', 'selected'].includes(a.name)) { attrs.push(jsxAttrName(a.name)); continue; }
      attrs.push(`${jsxAttrName(a.name)}=${strValue(v)}`);
    }
    if (el.matches('.map_wrapper > div:first-child') ) {
      return `${pad}<div ${attrs.join(' ')}>\n${pad}  {slots.map}\n${pad}</div>\n`;
    }
    const open = `${pad}<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    if (VOID.has(tag)) return `${open} />\n`;
    if (tag === 'textarea') return `${open} defaultValue={${JSON.stringify(el.value)}} />\n`;
    const pre = ctx.pre || /pre/.test(getComputedStyle(el).whiteSpace);
    const kids = [...el.childNodes].map((c) => emit(c, depth + 1, { pre })).join('');
    if (!kids) return `${open} />\n`;
    return `${open}>\n${kids}${pad}</${tag}>\n`;
  };

  if (targetSelector) {
    const target = document.querySelector(targetSelector);
    return target ? { jsx: emit(target, 2, { pre: false }), photos } : null;
  }

  const container = document.querySelector('#section-main').parentElement;
  const blocks = [...container.children].map((child, i) => ({
    name: child.id || [...child.classList].join('-') || `block-${i}`,
    height: Math.round(child.getBoundingClientRect().height),
    jsx: emit(child, 2, { pre: false }),
  }));
  const containerAttrs = [...container.attributes].map((a) => [a.name, a.value]);
  return { blocks, photos, containerAttrs, htmlClass: document.documentElement.className };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto('https://theirmood.com/card/vzUGuBO4E1', { waitUntil: 'networkidle', timeout: 90_000 });
  await page.evaluate(async () => {
    const d = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await d(200); }
  });
  await page.waitForTimeout(1500);
  const result = await page.evaluate(convertInPage, null);
  await browser.close();

  fs.mkdirSync(BLOCK_DIR, { recursive: true });
  const toComponent = (name) =>
    name.replace(/^section-/, '').split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  const index = [];
  for (const b of result.blocks) {
    const comp = toComponent(b.name);
    const usesPhoto = b.jsx.includes('photo(');
    const src = `// Generated by scripts/generate-jsx.mjs from the reference card DOM. Edit text here; swap photos in src/data/photos.js.
${usesPhoto ? "import { photo } from '../data/photos.js';\n" : ''}
export default function ${comp}({ slots = {} }) {
  return (
${b.jsx.replace(/^ {4}/, '    ')}  );
}
`;
    fs.writeFileSync(path.join(BLOCK_DIR, `${comp}.jsx`), src);
    index.push({ comp, name: b.name, height: b.height });
    console.log(comp.padEnd(20), b.height, 'px', b.jsx.length, 'chars');
  }
  fs.writeFileSync(path.join(ROOT, 'out', 'blocks.json'), JSON.stringify({ index, containerAttrs: result.containerAttrs, htmlClass: result.htmlClass }, null, 2));
  fs.writeFileSync(path.join(ROOT, 'out', 'photos.json'), JSON.stringify(result.photos, null, 2));
  console.log('photos', Object.keys(result.photos).length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
