import { samples } from './samples.js';

const element = (id) => document.getElementById(id);
const sampleButtons = [...document.querySelectorAll('[data-sample]')];
const resultBadge = document.querySelector('.output-panel .pill');
const resultSource = document.querySelector('.result-bottom > span');
const state = { image: null, imageVersion: 0, objectUrl: null, sample: samples[1], result: null, busy: false };

function setMessage(message = '') {
  element('message').textContent = message;
}

function clearResult() {
  state.result = null;
  element('result').hidden = true;
  element('empty').hidden = false;
  setMessage();
}

function setBusy(busy, message = '') {
  state.busy = busy;
  document.querySelectorAll('button, input').forEach((control) => { control.disabled = busy; });
  setMessage(message);
}

function releasePreview() {
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = null;
}

function clearSampleSelection() {
  state.sample = null;
  sampleButtons.forEach((button) => button.classList.remove('selected'));
  resultBadge.textContent = 'Live AI';
}

function selectSample(index) {
  if (state.busy) return;
  clearResult();
  releasePreview();
  state.imageVersion += 1;
  state.image = null;
  state.sample = samples[index];
  element('equation').value = state.sample.equation;
  element('sample-expression').textContent = state.sample.equation;
  element('sample-paper').hidden = false;
  element('upload-prompt').hidden = true;
  element('preview').hidden = true;
  element('read-image').hidden = true;
  element('file').value = '';
  element('image-url').value = '';
  resultBadge.textContent = 'Sample solution';
  sampleButtons.forEach((button) => button.classList.toggle('selected', Number(button.dataset.sample) === index));
}

function showPreview(source) {
  element('preview').src = source;
  element('preview').hidden = false;
  element('sample-paper').hidden = true;
  element('upload-prompt').hidden = true;
  element('read-image').hidden = false;
  element('equation').value = '';
}

function uploadImage(file) {
  if (state.busy || !file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    setMessage('Please choose a JPG, PNG or WebP image under 10 MB.');
    return;
  }
  clearResult();
  clearSampleSelection();
  releasePreview();
  const version = ++state.imageVersion;
  state.image = null;
  state.objectUrl = URL.createObjectURL(file);
  showPreview(state.objectUrl);
  element('image-url').value = '';
  setMessage('Photo ready. Select “Read equation from image” to transcribe it with AI.');
  const reader = new FileReader();
  reader.onload = () => { if (version === state.imageVersion) state.image = reader.result; };
  reader.onerror = () => { if (version === state.imageVersion) setMessage('Could not read this file. Try another image.'); };
  reader.readAsDataURL(file);
}

function loadImageUrl() {
  if (state.busy) return;
  let url;
  try {
    url = new URL(element('image-url').value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.includes('.') || /^[\d.]+$/.test(url.hostname) || url.hostname.includes('localhost')) throw new Error();
  } catch {
    setMessage('Enter a public HTTPS link pointing directly to an image.');
    return;
  }
  clearResult();
  clearSampleSelection();
  releasePreview();
  state.imageVersion += 1;
  state.image = url.href;
  element('preview').referrerPolicy = 'no-referrer';
  showPreview(state.image);
  setMessage('URL ready. Read the image to transcribe its equation.');
}

async function callApi(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(200000),
  });
  const data = await response.json().catch(() => ({ error: 'Could not reach the AI service. Check your sign-in and connection.' }));
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function readImage() {
  if (state.busy) return;
  if (!state.image) { setMessage('The image is still loading. Please try again.'); return; }
  clearResult();
  setBusy(true, 'Reading your equation…');
  try {
    const data = await callApi('/api/read', { image: state.image });
    element('equation').value = data.readable ? data.equation : '';
    clearSampleSelection();
    setBusy(false, data.readable ? `Equation read. Review it before solving. ${data.notes}` : data.notes || 'No clear equation found. Try a closer, sharper photo.');
  } catch (error) {
    setBusy(false, error.name === 'TimeoutError' ? 'The image request timed out. Please try again.' : error.message);
  }
}

function selectTab(name) {
  element('steps').hidden = name !== 'steps';
  element('check').hidden = name !== 'check';
  document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === name));
}

function textNode(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}

function renderSolution(solution, isSample) {
  state.result = { ...solution, isSample };
  element('empty').hidden = true;
  element('result').hidden = false;
  element('answer').textContent = solution.answer;
  element('answer-detail').textContent = solution.detail;
  element('steps').replaceChildren();
  solution.steps.forEach((step, index) => {
    const row = document.createElement('div');
    row.className = 'step';
    const content = document.createElement('div');
    ['h4', 'p', 'small'].forEach((tag, position) => content.append(textNode(tag, step[position])));
    row.append(textNode('span', index + 1), content);
    element('steps').append(row);
  });
  const checks = [...solution.check];
  if (solution.verification) checks.push(`Separate model review: ${solution.verification.notes}`);
  element('check').replaceChildren(...checks.map((text, index) => textNode(index ? 'p' : 'div', text)));
  resultBadge.textContent = isSample ? 'Sample solution' : solution.verification.passed ? 'Model check passed' : 'Review needed';
  resultSource.textContent = isSample ? '✧ Curated demo · no AI call made' : '✧ AI-generated · verify important results';
  selectTab('steps');
}

async function solveEquation() {
  if (state.busy) return;
  if (state.sample) { renderSolution(state.sample, true); return; }
  const equation = element('equation').value.trim();
  if (!equation) { setMessage('Read your image or enter an equation first.'); return; }
  if (equation.length > 1500) { setMessage('Use an equation under 1,500 characters.'); return; }
  clearResult();
  setBusy(true, 'Solving and checking your equation…');
  try {
    const solution = await callApi('/api/solve', { equation });
    renderSolution({ ...solution, steps: solution.steps.map((step) => [step.title, step.expression, step.explanation]) }, false);
    setBusy(false, solution.verification.passed ? '' : solution.verification.notes);
  } catch (error) {
    setBusy(false, error.name === 'TimeoutError' ? 'The solution request timed out. Please try again.' : error.message);
  }
}

async function copySolution() {
  const result = state.result;
  if (!result) return;
  const check = result.verification ? [`Separate model review: ${result.verification.notes}`] : [];
  try {
    await navigator.clipboard.writeText([
      result.equation, result.answer,
      ...result.steps.map((step) => step.join(': ')), ...result.check, ...check,
      result.isSample ? 'Curated demo; no AI call made.' : 'AI-generated; verify important results.',
    ].join('\n'));
    element('copy').textContent = 'Copied ✓';
    setTimeout(() => { element('copy').textContent = 'Copy solution ↗'; }, 1800);
  } catch { setMessage('Clipboard access is unavailable in this browser.'); }
}

sampleButtons.forEach((button) => button.addEventListener('click', () => selectSample(Number(button.dataset.sample))));
 document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.tab)));
element('file').addEventListener('change', (event) => uploadImage(event.target.files[0]));
element('load-url').addEventListener('click', loadImageUrl);
element('read-image').addEventListener('click', readImage);
element('solve').addEventListener('click', solveEquation);
element('copy').addEventListener('click', copySolution);
element('equation').addEventListener('input', () => { clearResult(); clearSampleSelection(); });
element('preview').addEventListener('error', () => setMessage('Image preview unavailable. Try uploading the file instead of using a URL.'));
element('drop').addEventListener('keydown', (event) => {
  if (!state.busy && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); element('file').click(); }
});
['dragenter', 'dragover'].forEach((name) => element('drop').addEventListener(name, (event) => {
  event.preventDefault();
  if (!state.busy) element('drop').classList.add('over');
}));
['dragleave', 'drop'].forEach((name) => element('drop').addEventListener(name, (event) => {
  event.preventDefault();
  element('drop').classList.remove('over');
  if (name === 'drop') uploadImage(event.dataTransfer.files[0]);
}));
window.addEventListener('pagehide', releasePreview);
