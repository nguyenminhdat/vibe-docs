const $=s=>document.querySelector(s);
let docs=[],category='All documents';
const toast=message=>{ $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2400); };
async function copy(value){try{await navigator.clipboard.writeText(value);toast('Copied to clipboard');}catch{toast('Clipboard unavailable — copy from the address bar');}}
function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function render(){
  const q=$('#search').value.toLocaleLowerCase().trim();
  const filtered=docs.filter(d=>(category==='All documents'||d.category===category)&&[d.title,d.description,d.category].join(' ').toLocaleLowerCase().includes(q));
  $('#count').textContent=filtered.length; $('#documents').replaceChildren(); $('#empty').hidden=!!filtered.length;
  for(const d of filtered){
    const card=node('article','card'),visual=node('div','card-visual'),icon=node('div','doc-icon');icon.setAttribute('aria-hidden','true');icon.append(node('b','','</>'),node('i'),node('i'),node('i'));visual.append(icon,node('span','visual-label','HTML / PUBLIC DOCUMENT'));
    const body=node('div','card-body'),heading=node('h3'),link=node('a','',d.title);link.href=d.path;heading.append(link);
    const date=new Date(d.updatedAt),meta=node('div','card-meta');meta.append(node('span','',Number.isNaN(date.valueOf())?'':date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})),node('span','',`${Math.max(1,Math.round(d.size/1024))} KB · HTML`));
    const actions=node('div','card-actions'),view=node('a','view','Open document ↗');view.href=d.path;
    const share=node('button','','Copy link');share.type='button';share.setAttribute('aria-label',`Copy link to ${d.title}`);share.onclick=()=>copy(new URL(d.path,location.href).href);
    const download=node('a','download','Download ↓');download.href=d.path;download.download=`${d.slug}.html`;download.setAttribute('aria-label',`Download ${d.title} HTML`);
    actions.append(view,share,download);body.append(node('span','card-category',d.category.toUpperCase()),heading,node('p','',d.description),meta,actions);card.append(visual,body);$('#documents').append(card);
  }
  document.querySelectorAll('#categories button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===category)));
}
$('#search').addEventListener('input',render);$('#reset').onclick=()=>{$('#search').value='';category='All documents';render();};
$('#copy-command').onclick=()=>copy('vdocs publish file.html --public');
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){e.preventDefault();$('#search').focus();}});
fetch('documents.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(!Array.isArray(data))throw Error();
  docs=data.filter(d=>/^[a-z0-9][a-z0-9-]*$/.test(d.slug)&&d.path===`docs/${d.slug}/index.html`&&typeof d.title==='string'&&typeof d.category==='string'&&typeof d.description==='string').sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  for(const c of ['All documents',...new Set(docs.map(d=>d.category))]){const b=node('button','',c);b.type='button';b.onclick=()=>{category=c;render();};$('#categories').append(b);}render();
}).catch(()=>{$('#documents').textContent='The library could not load. Please refresh and try again.';$('#count').textContent='—';});
