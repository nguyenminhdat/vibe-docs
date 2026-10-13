import {cpSync,rmSync,readFileSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog,validate} from './catalog.mjs';
catalog();
const docs=JSON.parse(readFileSync('documents.json','utf8'));validate(docs);
rmSync('dist',{recursive:true,force:true});
cpSync('public','dist',{recursive:true});
if(existsSync('dist/index.html')){
  let html=readFileSync('dist/index.html','utf8');
  for(const asset of ['assets/app.js','assets/style.css']){
    const hash=createHash('sha256').update(readFileSync(`dist/${asset}`)).digest('hex').slice(0,12);
    html=html.replaceAll(`"${asset}"`,`"${asset}?v=${hash}"`);
  }
  writeFileSync('dist/index.html',html);
}
for(const d of docs){
  if(d.visibility!=='listed'||(d.expiresAt&&Date.parse(d.expiresAt)<=Date.now()))continue;
  for(const alias of d.aliases||[]){
    mkdirSync(`dist/docs/${alias}`,{recursive:true});
    writeFileSync(`dist/docs/${alias}/index.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../${d.id}/"><title>Document moved</title><a href="../${d.id}/">Open document</a></html>`);
  }
}
console.log('Built dist/');
