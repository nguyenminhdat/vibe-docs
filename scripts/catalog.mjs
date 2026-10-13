import fs from 'node:fs';
import path from 'node:path';
export function validate(docs){
  if(!Array.isArray(docs))throw Error('Registry must be an array');
  const slugs=new Set(),ids=new Set();
  for(const d of docs){
    if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(d.slug)||slugs.has(d.slug)||!/^[a-f0-9]{32}$/.test(d.id)||ids.has(d.id)||d.path!==`docs/${d.id}/index.html`)throw Error('Unsafe or duplicate document path');
    if(!['listed','unlisted'].includes(d.visibility))throw Error('Invalid visibility');
    if(d.expiresAt!==undefined&&!Number.isFinite(Date.parse(d.expiresAt)))throw Error('Invalid expiry timestamp');
    for(const alias of d.aliases||[])if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(alias)||/^[a-f0-9]{32}$/.test(alias))throw Error('Unsafe legacy alias');
    slugs.add(d.slug);ids.add(d.id);
  }
}
export function catalog(repoRoot=process.cwd(),now=Date.now()){
  const docs=JSON.parse(fs.readFileSync(path.join(repoRoot,'documents.json'),'utf8'));validate(docs);
  const listed=listedRecords(docs,now);
  fs.writeFileSync(path.join(repoRoot,'public/documents.json'),JSON.stringify(listed,null,2)+'\n');
  return listed;
}
export function listedRecords(docs,now=Date.now()){
  // Keep old cached clients compatible without exposing the logical publishing key.
  return docs.filter(d=>d.visibility==='listed'&&(!d.expiresAt||Date.parse(d.expiresAt)>now)).map(({aliases,visibility,slug,...d})=>({...d,slug:d.id}));
}
export function unlistedHtml(text){
  // A crawler hint and referrer protection, not authentication or encryption.
  const metadata='<meta name="robots" content="noindex, nofollow"><meta name="referrer" content="no-referrer">';
  if(/<head\b[^>]*>/i.test(text))return text.replace(/<head\b[^>]*>/i,m=>m+metadata);
  return metadata+text;
}
