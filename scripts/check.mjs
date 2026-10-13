import fs from 'node:fs';
import path from 'node:path';
import {scan} from '../bin/vdocs.mjs';
import {validate,listedRecords} from './catalog.mjs';
import assert from 'node:assert/strict';
const docs=JSON.parse(fs.readFileSync('documents.json','utf8'));validate(docs);
for(const d of docs){if(!fs.existsSync(path.join('public',d.path)))throw Error(`Missing ${d.path}`);for(const k of ['title','category','description','updatedAt'])if(typeof d[k]!=='string')throw Error(`Missing metadata: ${k}`);}
const actual=JSON.parse(fs.readFileSync('public/documents.json','utf8'));assert.deepEqual(actual,listedRecords(docs),'Public catalog must contain only listed, unexpired documents');
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,entry.name);if(entry.isSymbolicLink())throw Error(`Symlink: ${p}`);if(entry.isDirectory())walk(p);else if(/\.(html?|css|js|mjs|json|svg|txt)$/.test(p))scan(p,fs.readFileSync(p,'utf8'));}}
walk('public');console.log(`Checked ${docs.length} document(s) and public files`);
