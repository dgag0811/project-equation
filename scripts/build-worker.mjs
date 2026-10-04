import { readFile, mkdir, writeFile } from 'node:fs/promises';

const assets = {};
const files = [
  ['index.html', 'text/html; charset=utf-8'],
  ['style.css', 'text/css; charset=utf-8'],
  ['app.js', 'text/javascript; charset=utf-8'],
  ['samples.js', 'text/javascript; charset=utf-8'],
];

for (const [name, type] of files) {
  assets[`/${name}`] = { type, content: await readFile(`web/${name}`, 'utf8') };
}

// The API module has no imports. Only strip its named export declarations.
const apiSource = (await readFile('worker/api.js', 'utf8'))
  .replace(/^export (?=(?:async )?function )/gm, '');

const source = `${apiSource}
const assets = ${JSON.stringify(assets)};
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return api(request, env);
    const asset = assets[path === '/' ? '/index.html' : path];
    if (!asset) return new Response('Not found', { status: 404 });
    return new Response(asset.content, {
      headers: {
        'Content-Type': asset.type,
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
      },
    });
  },
};
`;

await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
await writeFile('dist/server/index.js', source);
await writeFile('dist/.openai/hosting.json', await readFile('.openai/hosting.json'));
console.log('Built standalone Worker with embedded website assets.');
