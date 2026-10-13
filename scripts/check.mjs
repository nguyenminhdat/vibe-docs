import fs from 'node:fs';
import path from 'node:path';
import {scan} from '../bin/vdocs.mjs';
const docs=JSON.parse(fs.readFileSync('public/documents.json','utf8'));
const seen=new Set();
for(const d of docs){if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(d.slug)||seen.has(d.slug)||d.path!==`docs/${d.slug}/index.html`)throw Error('Invalid or duplicate document');seen.add(d.slug);if(!fs.existsSync(path.join('public',d.path)))throw Error(`Missing ${d.path}`);for(const k of ['title','category','description','updatedAt'])if(typeof d[k]!=='string')throw Error(`Missing metadata: ${k}`);}
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error(`Symlink: ${p}`);if(entry.isDirectory())walk(p);else if(/\.(html?|css|js|mjs|json|svg|txt)$/.test(p))scan(p,fs.readFileSync(p,'utf8'));}}
walk('public');console.log(`Checked ${docs.length} document(s) and public files`);
