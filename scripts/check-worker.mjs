import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { api, imageAllowed } from '../worker/api.js';

for (const url of ['http://example.com/image.png', 'https://127.0.0.1/image.png', 'https://example.local/image.png', 'data:image/svg+xml;base64,AAAA']) {
  assert.equal(imageAllowed(url), false);
}
assert.equal(imageAllowed('https://example.com/image.png'), true);

const fixtures = {
  transcription: { equation: '3x + 7 = 22', notes: '', readable: true },
  solution: {
    equation: '3x + 7 = 22', answer: 'x = 5', detail: 'One real solution.',
    steps: [{ title: 'Subtract 7', expression: '3x = 15', explanation: 'Balance the equation.' }],
    check: ['3(5) + 7 = 22'],
  },
  verification: { passed: true, notes: 'Substitution matches.' },
};
const env = { OPENAI_API_KEY: 'test-placeholder' };
const requests = [];
const originalFetch = globalThis.fetch;
let responseOverride = null;

function post(path, body, origin) {
  return new Request(`https://site.test${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    body: JSON.stringify(body),
  });
}

try {
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    requests.push(request);
    if (responseOverride) return responseOverride(request);
    const result = fixtures[request.text.format.name];
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(result) }] }] });
  };

  assert.equal((await api(post('/api/read', { image: 'https://example.com/math.png' }), env)).status, 200);
  const solution = await (await api(post('/api/solve', { equation: '3x + 7 = 22' }), env)).json();
  assert.equal(solution.answer, 'x = 5');
  assert.equal(solution.verification.passed, true);
  assert.equal(requests.length, 3);
  assert.equal((await api(post('/api/solve', { equation: '' }), env)).status, 400);
  assert.equal((await api(post('/api/solve', null), env)).status, 400);
  assert.equal((await api(post('/api/solve', []), env)).status, 400);
  assert.equal((await api(post('/api/solve', { equation: 'x=1' }, 'https://evil.test'), env)).status, 403);
  assert.equal((await api(post('/api/read', { image: 'https://localhost/a.png' }), env)).status, 400);
  assert.equal((await api(post('/api/solve', { equation: 'x=1' }), {})).status, 503);
  assert.equal((await api(post('/api/unknown', {}), env)).status, 404);

  responseOverride = () => Response.json({ error: { code: 'credit_balance_exhausted', type: 'insufficient_quota' } }, { status: 429 });
  const quota = await api(post('/api/solve', { equation: 'x=1' }), env);
  assert.match((await quota.json()).error, /API credits/);

  responseOverride = (request) => {
    const result = request.text.format.name === 'verification' ? { passed: 'yes', notes: '' } : fixtures.solution;
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(result) }] }] });
  };
  const unchecked = await (await api(post('/api/solve', { equation: '3x + 7 = 22' }), env)).json();
  assert.equal(unchecked.verification.passed, false);
} finally {
  globalThis.fetch = originalFetch;
}

const source = await readFile('dist/server/index.js', 'utf8');
const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
assert.equal(typeof worker.fetch, 'function');
for (const path of ['/', '/style.css', '/app.js', '/samples.js']) {
  assert.equal((await worker.fetch(new Request(`https://site.test${path}`), {})).status, 200);
}
console.log('Passed API flow, input validation, billing errors, failed verification, and embedded assets.');
