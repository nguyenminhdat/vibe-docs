import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate,catalog} from './catalog.mjs';
export function expire(repoRoot=process.cwd(),now=Date.now()){
  const manifest=path.join(repoRoot,'documents.json'),docs=JSON.parse(fs.readFileSync(manifest,'utf8'));
  // Validate every record before any deletion; never trust manifest paths.
  validate(docs);
  const expired=docs.filter(d=>d.expiresAt&&Date.parse(d.expiresAt)<=now);
  for(const d of expired)fs.rmSync(path.join(repoRoot,'public/docs',d.id),{recursive:true,force:true});
  if(expired.length)fs.writeFileSync(manifest,JSON.stringify(docs.filter(d=>!expired.includes(d)),null,2)+'\n');
  catalog(repoRoot,now);
  return expired.map(d=>d.slug);
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
  const removed=expire();console.log(`Expired documents removed: ${removed.join(', ')||'none'}`);
  if(process.env.GITHUB_OUTPUT)fs.appendFileSync(process.env.GITHUB_OUTPUT,`changed=${removed.length>0}\n`);
}
