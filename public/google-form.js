import {initCaseAnimation} from './cases.js';
initCaseAnimation();
const dialog=document.querySelector('#consult-dialog');
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.mobile-nav');
let lastFocus;
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');menu.textContent='☰';}
menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');menu.textContent=open?'×':'☰';});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.querySelectorAll('[data-consult]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();lastFocus=document.activeElement;closeMenu();const iframe=dialog.querySelector('iframe');if(!iframe.src)iframe.src=iframe.dataset.src;dialog.showModal();document.body.classList.add('locked');}));
dialog.addEventListener('close',()=>{document.body.classList.remove('locked');lastFocus?.focus();});
dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.querySelectorAll('[data-print]').forEach(el=>el.addEventListener('click',()=>window.print()));
