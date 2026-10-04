import {readFile} from 'node:fs/promises';
import {api} from '../worker/api.js';
const contents=await readFile('.env.local','utf8');const key=contents.match(/^OPENAI_API_KEY\s*=\s*(.+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
if(!key)throw new Error('No key configured');
const image='data:image/png;base64,'+ (await readFile('/private/tmp/equation-smoke.png')).toString('base64');
const env={OPENAI_API_KEY:key};
const request=(path,body)=>new Request('https://site.test'+path,{method:'POST',body:JSON.stringify(body)});
const read=await api(request('/api/read',{image}),env);const transcription=await read.json();console.log('Transcription status:',read.status,JSON.stringify(transcription));if(!read.ok)process.exit(1);
const solve=await api(request('/api/solve',{equation:transcription.equation}),env);const result=await solve.json();console.log('Solution status:',solve.status,'Answer:',result.answer||result.error,'Check passed:',result.verification?.passed);if(!solve.ok)process.exit(1);
