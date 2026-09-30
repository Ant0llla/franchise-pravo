const dialog=document.querySelector('#consult-dialog');
const form=document.querySelector('#consult-form');
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('.mobile-nav');
let lastFocus;
let requestId=crypto.randomUUID();
let submitting=false;
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');menu.textContent='☰';}
menu.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');menu.textContent=open?'×':'☰';});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
function openConsult(scenario){lastFocus=document.activeElement;closeMenu();document.querySelector('#form-content').hidden=false;document.querySelector('#form-success').hidden=true;document.querySelector('#form-error').hidden=true;if(scenario)form.elements.scenario.value=scenario;dialog.showModal();document.body.classList.add('locked');}
function closeConsult(){if(submitting)return;dialog.close();}
dialog.addEventListener('close',()=>{document.body.classList.remove('locked');lastFocus?.focus();});
dialog.addEventListener('cancel',e=>{if(submitting)e.preventDefault();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeConsult();}});
document.querySelectorAll('[data-consult]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();openConsult(el.dataset.consult);}));
document.querySelector('.close-dialog').addEventListener('click',closeConsult);
document.querySelector('#success-close').addEventListener('click',closeConsult);
document.querySelectorAll('[data-print]').forEach(el=>el.addEventListener('click',()=>window.print()));
const isStatic=document.body.dataset.static==='true';
const utm={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const v=new URLSearchParams(location.search).get(k);if(v)utm[k]=v;}
try{if(Object.keys(utm).length)sessionStorage.setItem('fp-utm',JSON.stringify(utm));else Object.assign(utm,JSON.parse(sessionStorage.getItem('fp-utm')||'{}'));}catch{}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(submitting||!form.reportValidity())return;
 const error=document.querySelector('#form-error');const submit=form.querySelector('[type=submit]');
 error.hidden=true;submitting=true;submit.disabled=true;submit.textContent='Сохраняем…';
 const payload=Object.fromEntries(new FormData(form));payload.consent=form.elements.consent.checked;payload.requestId=requestId;payload.utm=utm;
 try{if(isStatic){
 const labels={entry:'До входа во франшизу',working:'Работа в сети',exit:'Рассматриваю выход',dispute:'Спор или претензия'};
 const text=['ФРАНЧАЙЗИ.ПРАВО — обращение','',labels[payload.scenario],'Имя: '+payload.name,'Контакт: '+payload.contact,'Клуб: '+(payload.company||'—'),'',payload.message||'Описание не указано','','Этот файл подготовлен в браузере. Юристу он не отправлен.'].join('\n');
 const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Моё обращение.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 document.querySelector('#form-content').hidden=true;const success=document.querySelector('#form-success');success.hidden=false;success.querySelector('.eyebrow').textContent='Текст обращения подготовлен';success.querySelector('h3').textContent='Скачивание началось.';success.querySelector('p').textContent='Файл сохранится в загрузках вашего браузера. Он не отправлен юристу. Его можно проверить и использовать при обращении.';document.querySelector('#receipt').textContent='';document.querySelector('#success-close').focus();return;
 }const response=await fetch('/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Не удалось сохранить заявку. Попробуйте ещё раз.');
 document.querySelector('#form-content').hidden=true;document.querySelector('#form-success').hidden=false;document.querySelector('#receipt').textContent='Номер: '+result.id.slice(0,8).toUpperCase();document.querySelector('#success-close').focus();form.reset();requestId=crypto.randomUUID();
 }catch(err){error.textContent=err.name==='TimeoutError'?'Не удалось получить подтверждение. Повторите отправку: дубликат не будет создан.':err.name==='TypeError'?'Нет соединения с сервером. Проверьте подключение и попробуйте снова.':err.message;error.hidden=false;error.scrollIntoView({block:'nearest'});}
 finally{submitting=false;submit.disabled=false;submit.innerHTML=(isStatic?'Скачать моё обращение':'Сохранить тестовую заявку')+' <span class="arrow">↗</span>';}
});
