import {cpSync,rmSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {catalog,validate} from './catalog.mjs';
catalog();
const docs=JSON.parse(readFileSync('documents.json','utf8'));validate(docs);
rmSync('dist',{recursive:true,force:true});
cpSync('public','dist',{recursive:true});
for(const d of docs){
  if(d.visibility!=='listed'||(d.expiresAt&&Date.parse(d.expiresAt)<=Date.now()))continue;
  for(const alias of d.aliases||[]){
    mkdirSync(`dist/docs/${alias}`,{recursive:true});
    writeFileSync(`dist/docs/${alias}/index.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../${d.id}/"><title>Document moved</title><a href="../${d.id}/">Open document</a></html>`);
  }
}
console.log('Built dist/');
