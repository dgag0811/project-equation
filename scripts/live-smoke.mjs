import { readFile, access } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { api } from '../worker/api.js';

const imagePath = process.argv[2];
if (!imagePath) {
  console.error('Usage: node scripts/live-smoke.mjs <equation.png>');
  process.exit(1);
}
try { await access('.env.local'); loadEnvFile('.env.local'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
if (!process.env.OPENAI_API_KEY) throw new Error('Configure OPENAI_API_KEY in the environment or .env.local.');

const image = `data:image/png;base64,${(await readFile(imagePath)).toString('base64')}`;
const env = { OPENAI_API_KEY: process.env.OPENAI_API_KEY, OPENAI_MODEL: process.env.OPENAI_MODEL };
function request(path, body) {
  return new Request(`https://site.test${path}`, { method: 'POST', body: JSON.stringify(body) });
}

const readResponse = await api(request('/api/read', { image }), env);
const transcription = await readResponse.json();
console.log('Transcription status:', readResponse.status, JSON.stringify(transcription));
if (!readResponse.ok || !transcription.readable) process.exit(1);

const solveResponse = await api(request('/api/solve', { equation: transcription.equation }), env);
const solution = await solveResponse.json();
console.log('Solution status:', solveResponse.status, 'Answer:', solution.answer || solution.error, 'Check passed:', solution.verification?.passed);
if (!solveResponse.ok || !solution.verification?.passed) process.exit(1);
