#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const allowed=new Set('.html .htm .css .js .mjs .svg .png .jpg .jpeg .gif .webp .avif .ico .woff .woff2 .ttf .otf .mp4 .webm .pdf .json .txt'.split(' '));
const textTypes=new Set('.html .htm .css .js .mjs .svg .json .txt'.split(' '));
const forbidden=/(^|[\/])(?:\.env[^\/]*|\.git|node_modules|credentials[^\/]*|secrets?[^\/]*|id_rsa|id_ed25519)([\/]|$)/i;
export function scan(name,content){
  if(forbidden.test(name))throw Error(`Blocked sensitive filename: ${name}`);
  const rules=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b/,/\b(?:password|api[_-]?key|access[_-]?token|client[_-]?secret)\s*[=:]\s*["'][^"'\s]{8,}["']/i,/\b(?:confidential|internal use only|tài liệu nội bộ|bí mật|không được chia sẻ)\b/i,/https?:\/\/(?:[^/\s"']*\.)?(?:frt\.vn|fptretail\.com\.vn|localhost|127\.0\.0\.1)(?:[/:\s"']|$)/i];
  if(rules.some(r=>r.test(content)))throw Error(`Potential secret or internal content in ${name}. Review and sanitize before publishing.`);
}
function inside(base,file){return file===base||file.startsWith(base+path.sep);}
export function collect(source){
  const sourcePath=path.resolve(source);
  if(fs.lstatSync(sourcePath).isSymbolicLink())throw Error('Symlinks are not allowed');
  const isDirectory=fs.statSync(sourcePath).isDirectory(),base=isDirectory?sourcePath:path.dirname(sourcePath);
  const entry=isDirectory?path.join(base,'index.html'):sourcePath;
  if(!/\.html?$/i.test(entry)||!fs.existsSync(entry))throw Error('Use an HTML file or a folder containing index.html');
  const files=new Map();
  function add(file){
    file=path.resolve(file);if(!inside(base,file))throw Error('Asset escapes document folder');
    const rel=path.relative(base,file);
    if(rel.split(path.sep).some(p=>p.startsWith('.'))||forbidden.test(rel))throw Error(`Blocked path: ${rel}`);
    // Reject symlink components, including directory symlinks.
    let check=base;for(const part of rel.split(path.sep)){check=path.join(check,part);if(fs.lstatSync(check).isSymbolicLink())throw Error(`Symlink: ${rel}`);}
    if(!allowed.has(path.extname(file).toLowerCase()))throw Error(`Unsupported file type: ${rel}`);
    if(files.has(rel))return;
    const bytes=fs.readFileSync(file);if(bytes.length>25*1024*1024)throw Error(`File exceeds 25 MB: ${rel}`);
    if(textTypes.has(path.extname(file).toLowerCase()))scan(rel,bytes.toString());
    files.set(rel,bytes);
    if(/\.(html?|css|m?js)$/i.test(file)){
      const content=bytes.toString(),refs=[];
      for(const m of content.matchAll(/(?:src|href|poster)\s*=\s*["']([^"']+)["']|url\(\s*["']?([^\s)'";]+)|@import\s*["']([^"']+)["']|\b(?:import|export)\s+(?:[^;]*?\sfrom\s*)?["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']/g))refs.push(m.slice(1).find(Boolean));
      for(const m of content.matchAll(/srcset\s*=\s*["']([^"']+)["']/g))for(const v of m[1].split(','))refs.push(v.trim().split(/\s+/)[0]);
      for(const ref of refs){
        if(/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref))continue;
        const raw=ref.split(/[?#]/)[0];if(!raw)continue;
        if(raw.startsWith('/'))throw Error(`Root-relative asset is not portable: ${raw}. Use a relative path.`);
        const asset=path.resolve(path.dirname(file),decodeURIComponent(raw));
        if(!inside(base,asset))throw Error(`Asset escapes source folder: ${raw}`);
        if(!fs.existsSync(asset))throw Error(`Missing local asset: ${raw}`);
        if(fs.statSync(asset).isDirectory())add(path.join(asset,'index.html'));else add(asset);
      }
    }
  }
  if(isDirectory){
    function walk(dir){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name);if(fs.lstatSync(p).isSymbolicLink())throw Error(`Symlink: ${name}`);if(name.startsWith('.')||forbidden.test(p))throw Error(`Blocked path: ${name}`);if(fs.statSync(p).isDirectory())walk(p);else add(p);}}
    walk(base);
  }else add(entry);
  // Keep original HTML path as well so relative references to it still work.
  files.set('index.html',fs.readFileSync(entry));
  const size=[...files.values()].reduce((n,b)=>n+b.length,0);if(size>100*1024*1024)throw Error('Document bundle exceeds 100 MB');
  return {files,size,entry,base};
}
function run(cmd,args,cwd=root){return execFileSync(cmd,args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();}
function options(args){const out={};for(let i=0;i<args.length;i++){const key=args[i];if(!key.startsWith('--'))throw Error(`Unexpected argument: ${key}`);if(['--public','--no-push'].includes(key))out[key.slice(2)]=true;else if(['--slug','--title','--category','--description'].includes(key)){if(!args[i+1]||args[i+1].startsWith('--'))throw Error(`Missing value for ${key}`);out[key.slice(2)]=args[++i];}else throw Error(`Unknown option: ${key}`);}return out;}
export function publish(source,opts={},repoRoot=root){
  if(!opts.public)throw Error('This is a PUBLIC repository. Confirm the document is cleared for public sharing with --public. Never publish internal or sensitive data.');
  const bundle=collect(source),slug=opts.slug||path.basename(path.resolve(source),path.extname(source)).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug))throw Error('Slug must be 1–80 lowercase letters, numbers or hyphens');
  const publicDir=path.join(repoRoot,'public'),manifest=path.join(publicDir,'documents.json'),target=path.join(publicDir,'docs',slug);
  if(inside(target,path.resolve(source)))throw Error('Source must be outside the published document folder');
  let docs=JSON.parse(fs.readFileSync(manifest,'utf8')),previous=docs.find(d=>d.slug===slug);
  const title=opts.title||previous?.title||fs.readFileSync(bundle.entry,'utf8').match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()||slug;
  const record={slug,title,category:opts.category||previous?.category||'Documents',description:opts.description??previous?.description??'A public HTML document.',path:`docs/${slug}/index.html`,updatedAt:new Date().toISOString(),size:bundle.size};
  scan('metadata',JSON.stringify(record));
  if(!opts['no-push']){
    run('gh',['auth','status'],repoRoot);
    if(run('git',['branch','--show-current'],repoRoot)!=='main')throw Error('Publish from the main branch');
    if(run('git',['status','--porcelain'],repoRoot))throw Error('Working tree must be clean before publishing. Commit or stash your changes first.');
    run('git',['pull','--ff-only'],repoRoot);
    docs=JSON.parse(fs.readFileSync(manifest,'utf8'));
    // Reload remote metadata after pulling to avoid overwriting concurrent updates.
    previous=docs.find(d=>d.slug===slug);for(const key of ['title','category','description'])if(opts[key]===undefined&&previous)record[key]=previous[key];
  }
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'vdocs-'));
  try{for(const [rel,bytes] of bundle.files){const dest=path.join(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);}fs.mkdirSync(path.dirname(target),{recursive:true});fs.rmSync(target,{recursive:true,force:true});fs.cpSync(temp,target,{recursive:true});}finally{fs.rmSync(temp,{recursive:true,force:true});}
  docs=docs.filter(d=>d.slug!==slug);docs.push(record);fs.writeFileSync(manifest,JSON.stringify(docs,null,2)+'\n');
  if(!opts['no-push']){run('git',['add','--',`public/docs/${slug}`,'public/documents.json'],repoRoot);run('git',['commit','-m',`Publish document: ${slug}`],repoRoot);run('git',['push','origin','main'],repoRoot);}
  return record;
}
function main(){
  const [command,source,...args]=process.argv.slice(2);
  if(command!=='publish'||!source){console.log('Usage: vdocs publish <file.html|folder> --public [--slug name] [--title "Title"] [--category Guides] [--description "Summary"] [--no-push]');return;}
  const record=publish(source,options(args));console.log(`Published ${record.title}\nhttps://nguyenminhdat.github.io/vibe-docs/${record.path.replace('index.html','')}\n${args.includes('--no-push')?'Local only; changes were not committed or pushed.':'GitHub Pages is deploying. Check: gh run list --workflow pages.yml'}`);
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){try{main();}catch(e){console.error(`vdocs: ${e.message}`);process.exitCode=1;}}
