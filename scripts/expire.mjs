import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function expire(repoRoot=process.cwd(),now=Date.now()){
  const manifest=path.join(repoRoot,'public/documents.json'),docs=JSON.parse(fs.readFileSync(manifest,'utf8'));
  // Validate every record before any deletion; never trust manifest paths.
  const seen=new Set();
  for(const d of docs){
    if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(d.slug)||seen.has(d.slug)||d.path!==`docs/${d.slug}/index.html`)throw Error('Unsafe or duplicate document path');
    seen.add(d.slug);if(d.expiresAt!==undefined&&!Number.isFinite(Date.parse(d.expiresAt)))throw Error('Invalid expiry timestamp');
  }
  const expired=docs.filter(d=>d.expiresAt&&Date.parse(d.expiresAt)<=now);
  for(const d of expired)fs.rmSync(path.join(repoRoot,'public/docs',d.slug),{recursive:true,force:true});
  if(expired.length)fs.writeFileSync(manifest,JSON.stringify(docs.filter(d=>!expired.includes(d)),null,2)+'\n');
  return expired.map(d=>d.slug);
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
  const removed=expire();console.log(`Expired documents removed: ${removed.join(', ')||'none'}`);
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`changed=${removed.length>0}\n`);
}
