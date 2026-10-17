import { execFileSync } from 'child_process';

const cred = execFileSync('git', ['credential', 'fill'], { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8' });
const token = cred.split('\n').find((l) => l.startsWith('password=')).slice(9);
const action = process.argv[2] || 'get';
const actions = {
  get: ['GET', '/repos/vividcolor12/newChapter/pages'],
  main: ['PUT', '/repos/vividcolor12/newChapter/pages', JSON.stringify({ build_type: 'legacy', source: { branch: 'main', path: '/' } })],
  pages: ['PUT', '/repos/vividcolor12/newChapter/pages', JSON.stringify({ build_type: 'legacy', source: { branch: 'gh-pages', path: '/' } })],
  build: ['POST', '/repos/vividcolor12/newChapter/pages/builds'],
  builds: ['GET', '/repos/vividcolor12/newChapter/pages/builds?per_page=2'],
};
const [method, path, body] = actions[action];
const res = await fetch(`https://api.github.com${path}`, {
  method,
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'wedding-pages',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  },
  body,
});
console.log(res.status);
console.log(await res.text());
