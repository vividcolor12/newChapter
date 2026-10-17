import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BASE = '/newChapter/';
const SITE_URL = `https://vividcolor12.github.io${BASE}`;
// src/data/accounts.js 의 페이지 키와 같아야 합니다.
const PAGES = ['p', 'j', 'z'];

// 정적 호스팅(GitHub Pages)에서 /newChapter/p, /j, /z 주소가 열리도록
// 빌드된 index.html 을 페이지별 폴더로 복사합니다. 알 수 없는 주소는 404.html 이
// 같은 앱(기본 페이지 z)을 보여 줍니다.
function multiPage() {
  let outDir;
  return {
    name: 'multi-page',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const page of PAGES) {
        const dir = path.join(outDir, page);
        fs.mkdirSync(dir, { recursive: true });
        const url = page === 'z' ? SITE_URL : `${SITE_URL}${page}/`;
        fs.writeFileSync(path.join(dir, 'index.html'), html.replaceAll(`content="${SITE_URL}"`, `content="${url}"`));
      }
      fs.writeFileSync(path.join(outDir, '404.html'), html);
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), multiPage()],
  server: {
    port: 5173,
    open: false,
  },
});
