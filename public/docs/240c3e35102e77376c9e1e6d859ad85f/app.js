const button=document.querySelector('#theme');
let saved=null;try{saved=localStorage.getItem('hello-vibe-docs-theme');}catch{}
function apply(theme){document.documentElement.dataset.theme=theme;button.setAttribute('aria-pressed',String(theme==='dark'));button.textContent=theme==='dark'?'Chế độ sáng':'Chế độ tối';}
apply(saved==='dark'?'dark':'light');
button.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';apply(theme);try{localStorage.setItem('hello-vibe-docs-theme',theme);}catch{}});
