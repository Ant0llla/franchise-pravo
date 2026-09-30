import http from 'node:http';
import {readFile,mkdir,appendFile} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const root=dirname(fileURLToPath(import.meta.url));
const publicDir=resolve(root,'public');
const mode=process.env.SITE_MODE||'preview';
const port=Number(process.env.PORT||4173);
const dataDir=process.env.DATA_DIR||resolve(root,'.data');
if(mode!=='preview') throw new Error('Public launch requires confirmed operator details, privacy documents and a delivery integration. Keep SITE_MODE=preview until configured.');
const buckets=new Map();
const seen=new Map();
export function validateLead(v){
 if(!v||typeof v!=='object')return 'Некорректная заявка.';
 if(!['entry','working','exit','dispute'].includes(v.scenario))return 'Выберите ситуацию.';
 if(typeof v.name!=='string'||v.name.trim().length<2||v.name.length>100)return 'Укажите имя (от 2 до 100 символов).';
 if(typeof v.contact!=='string'||v.contact.length>160||!(/^\+?[\d\s()\-]{10,25}$/.test(v.contact.trim())||/^@\w{5,32}$/.test(v.contact.trim())||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contact.trim())))return 'Укажите телефон, email или Telegram в формате @username.';
 if(v.consent!==true)return 'Подтвердите согласие на обработку заявки.';
 if(typeof v.message!=='string'||v.message.length>2500)return 'Описание должно быть не длиннее 2500 символов.';
 if(v.company!==undefined&&(typeof v.company!=='string'||v.company.length>150))return 'Сократите название клуба.';
 if(typeof v.requestId!=='string'||!/^[a-zA-Z0-9-]{16,64}$/.test(v.requestId))return 'Обновите страницу и повторите отправку.';
 return null;
}
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'",'Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
function json(res,status,data){res.writeHead(status,{...headers,'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
export const server=http.createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/config'&&req.method==='GET')return json(res,200,{mode});
 if(url.pathname==='/api/leads'&&req.method==='POST'){
  const origin=req.headers.origin;
  if(!origin||new URL(origin).host!==req.headers.host)return json(res,403,{error:'Недопустимый источник запроса.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'Неподдерживаемый формат.'});
  const ip=req.socket.remoteAddress, now=Date.now();
  for(const[k,v]of buckets)if(now-v.start>600000)buckets.delete(k);
  const b=buckets.get(ip)||{start:now,count:0};b.count++;buckets.set(ip,b);
  if(b.count>15)return json(res,429,{error:'Слишком много попыток. Попробуйте через 10 минут.'});
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>12000)return json(res,413,{error:'Слишком большой запрос.'});}
  let v;try{v=JSON.parse(body);}catch{return json(res,400,{error:'Не удалось прочитать заявку.'});}
  if(v.website)return json(res,400,{error:'Не удалось отправить заявку.'});
  const error=validateLead(v);if(error)return json(res,422,{error});
  if(seen.has(v.requestId))return json(res,200,{id:seen.get(v.requestId),mode});
  const id=randomUUID();seen.set(v.requestId,id);
  const safe={id,createdAt:new Date().toISOString(),mode,scenario:v.scenario,name:v.name.trim(),contact:v.contact.trim(),company:(v.company||'').trim(),message:v.message.trim(),consent:true,consentVersion:'preview-2026-09-30',utm:{}};
  for(const k of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'])if(typeof v.utm?.[k]==='string')safe.utm[k]=v.utm[k].slice(0,250);
  try{await mkdir(dataDir,{recursive:true,mode:0o700});await appendFile(resolve(dataDir,'leads.jsonl'),JSON.stringify(safe)+'\n',{mode:0o600});}catch(e){seen.delete(v.requestId);throw e;}
  if(seen.size>5000)seen.delete(seen.keys().next().value);
  return json(res,201,{id,mode});
 }
 if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Метод не поддерживается.'});
 let pathname=decodeURIComponent(url.pathname);
 let target=resolve(publicDir,'.'+pathname);
 if(target!==publicDir&&!target.startsWith(publicDir+'/'))return json(res,403,{error:'Доступ запрещён.'});
 if(pathname.endsWith('/'))target=resolve(target,'index.html');
 let body;try{body=await readFile(target);}catch{res.writeHead(404,{...headers,'Content-Type':'text/html; charset=utf-8'});return res.end(await readFile(resolve(publicDir,'404.html')));}
 const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
 res.writeHead(200,{...headers,'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:body);
 }catch{json(res,500,{error:'Заявка не сохранена. Попробуйте ещё раз.'});}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(port,'127.0.0.1',()=>console.log(`Franchise.Pravo preview: http://127.0.0.1:${port}`));
