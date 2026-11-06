import {resultColumns,resultValue} from './lib/result-columns.mjs';
import {setupDisplayPreferences} from './lib/display-preferences.mjs';
import {searchWithRetry} from './lib/search-retry.mjs';
import {saveSpreadsheet} from './lib/transaction-export.mjs';
import {readFavorites,saveFavorite,removeFavorite,clearFavorites} from './lib/favorite-cards.mjs';
import {trackEvent} from './lib/analytics.mjs';
import {detectCardBrand} from './lib/card-brand.mjs';
import {operators,operatorName} from './lib/operator-catalog.mjs';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import {escapeHTML as e,money,dateLabel,receiptPages,savePDF} from './receipts.js';
import {ARCHIVE_START,searchWindows,mergeTransactions,abortableDelay} from './lib/search-plan.mjs';
import { inject } from '@vercel/analytics';

// Initialize Vercel Web Analytics
if(!['localhost','127.0.0.1','::1'].includes(location.hostname))inject({mode:'production',beforeSend(event){const url=new URL(event.url,location.origin);url.search='';url.hash='';return {...event,url:url.href};}});
const $=id=>document.getElementById(id);
let rows=[],statuses=[],selected=new Set(),filter='all',view=matchMedia('(max-width:700px)').matches?'card':'table',query=null,previewRows=[],controller=null,loading=false,exporting=false;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function syncDates(){for(const id of ['start','end']){const value=$(id).value;$(id+'-display').textContent=value?value.split('-').reverse().join(' / '):'Pilih tanggal';}}
function updateCardBrand(field='card',prefix='card-brand'){const brand=detectCardBrand($(field).value);$(prefix+'-icon').innerHTML=brand?`<img src="/assets/brands/${brand.id}.svg" alt="">`:'▣';$(prefix+'-icon').classList.toggle('recognized',!!brand);$(prefix+'-status').textContent=brand?`Perkiraan jenis kartu: ${brand.name}.`:'Jenis kartu belum dikenali.';}
function period(days){$('archive-hint').hidden=true;const end=today(),start=new Date(end+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-days+1);$('start').value=start.toISOString().slice(0,10);$('end').value=end;syncDates();}
period(7);$('start').max=$('end').max=today();
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>period(Number(b.dataset.days)));
$('all-history').onclick=()=>{$('start').value=ARCHIVE_START;$('end').value=today();$('archive-hint').hidden=false;syncDates();};
for(const id of ['start','end'])$(id).addEventListener('input',syncDates);
$('end').onchange=syncDates;
$('start').onchange=()=>{$('archive-hint').hidden=$('start').value!==ARCHIVE_START;syncDates();};
$('card').oninput=()=>{$('card').value=$('card').value.replace(/\D/g,'').slice(0,16).replace(/(.{4})(?=.)/g,'$1 ');updateCardBrand();};
$('card').addEventListener('change',updateCardBrand);
window.addEventListener('pageshow',()=>{updateCardBrand();syncDates();});
let favoriteCards=[];
function renderFavorites(){
 $('favorite-list').replaceChildren();
 const groups=new Map();
 for(const item of favoriteCards){
  const detected=detectCardBrand(item.card),brand=detected?.name||'Kartu lainnya';
  if(!groups.has(brand)){const group=document.createElement('details');group.open=true;const title=document.createElement('summary');if(detected){const logo=document.createElement('img');logo.src=`/assets/brands/${detected.id}.svg`;logo.alt=brand;title.append(logo);}else title.textContent=brand;const list=document.createElement('ul');group.append(title,list);$('favorite-list').append(group);groups.set(brand,list);}
  const li=document.createElement('li');li.className='favorite-item';
  const use=document.createElement('button');use.type='button';use.className='favorite-use';use.textContent=item.name;
  const detail=document.createElement('small');detail.textContent=`${detectCardBrand(item.card)?.name||'Kartu'} · •••• ${item.card.slice(-4)}`;use.append(detail);
  use.onclick=()=>{$('card').value=item.card.replace(/(.{4})(?=.)/g,'$1 ');$('favorite-name').value=item.name;updateCardBrand();$('favorite-message').textContent='Nomor kartu terisi. Pilih tanggal dan tekan Cari struk.';$('card').focus();};
  const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent='Hapus';remove.setAttribute('aria-label',`Hapus kartu ${item.name}`);
  remove.onclick=()=>{try{favoriteCards=removeFavorite(localStorage,item.card);renderFavorites();$('favorite-message').textContent='Kartu favorit dihapus.';}catch{$('favorite-message').textContent='Kartu tidak dapat dihapus. Periksa izin penyimpanan browser.';}};
  li.append(use,remove);groups.get(brand).append(li);
 }
 $('clear-favorites').hidden=!favoriteCards.length;
}
function loadFavorites(){try{favoriteCards=readFavorites(localStorage);renderFavorites();}catch{$('favorite-message').textContent='Favorit tidak dapat dibaca. Anda tetap bisa mengetik nomor kartu untuk mencari.';$('clear-favorites').hidden=false;}}
$('add-favorite').onclick=()=>{$('favorite-card').value=$('card').value;$('favorite-name').value='';$('favorite-error').textContent='';updateCardBrand('favorite-card','favorite-brand');$('favorite-dialog').showModal();$('favorite-card').focus();};
$('favorite-card').oninput=()=>{$('favorite-card').value=$('favorite-card').value.replace(/\D/g,'').slice(0,16).replace(/(.{4})(?=.)/g,'$1 ');updateCardBrand('favorite-card','favorite-brand');};
$('cancel-favorite').onclick=()=>$('favorite-dialog').close();
$('favorite-form').onsubmit=event=>{event.preventDefault();try{favoriteCards=saveFavorite(localStorage,$('favorite-card').value,$('favorite-name').value);renderFavorites();$('card').value=$('favorite-card').value.replace(/\s/g,'').replace(/(.{4})(?=.)/g,'$1 ');updateCardBrand();$('favorite-dialog').close();$('favorite-message').textContent='Kartu disimpan dan siap dipakai untuk pencarian.';}catch(err){$('favorite-error').textContent=err.name==='Error'?err.message:'Penyimpanan browser tidak tersedia.';}};
$('clear-favorites').onclick=()=>{try{clearFavorites(localStorage);favoriteCards=[];renderFavorites();$('favorite-message').textContent='Semua kartu favorit dihapus.';}catch{$('favorite-message').textContent='Penyimpanan tidak dapat diakses. Hapus data situs lewat pengaturan browser.';}};
window.addEventListener('storage',event=>{if(event.key===null||event.key==='jejaktol.favorite-cards.v1')loadFavorites();});
loadFavorites();
const visible=()=>rows.filter(r=>filter==='all'||r.operator===filter).sort((a,b)=>$('sort').value==='asc'?a.dateTime.localeCompare(b.dateTime):b.dateTime.localeCompare(a.dateTime));
function selection(){const list=visible();$('selected-count').textContent=`${selected.size} dipilih`;$('select-all').checked=!!list.length&&list.every(r=>selected.has(r.id));$('select-all').indeterminate=list.some(r=>selected.has(r.id))&&!$('select-all').checked;$('preview').disabled=$('download').disabled=!selected.size||exporting;}
function render(){
 const list=visible();$('count').textContent=rows.length;$('total').textContent=money(rows.reduce((s,r)=>s+r.fare,0));$('operator-count').textContent=`${new Set(rows.map(r=>r.operator)).size} operator`;
 for(const op of ['all',...Object.keys(operators)])$('tab-'+op).textContent=rows.filter(r=>op==='all'||r.operator===op).length;
 $('source-status').innerHTML=statuses.map(s=>`<div class="source-chip ${s.status==='pending'?'pending':s.status!=='success'?'error-status':''}">${e(s.name)} · ${s.status==='pending'?e(s.message||'Menghubungkan…'):s.status==='success'?`${s.count} transaksi`:e(s.message)}${s.status==='error'?` <a href="${operators[s.source]?.url||operators.astra.url}" target="_blank" rel="noopener noreferrer">Situs resmi </a>`:''}</div>`).join('');
 const check=r=>`<input type="checkbox" data-select="${r.id}" ${selected.has(r.id)?'checked':''} aria-label="Pilih transaksi ${e(r.dateTime)}">`,badge=r=>`<span class="operator-label ${r.operator}"><img src="/assets/brands/${r.operator}.${r.operator==='jtd'?'svg':'png'}" alt="${e(operatorName(r.operator))}" width="90" height="30"></span>`,preview=r=>`${r.originalReceiptUrl?`<a class="row-preview" href="${e(r.originalReceiptUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Struk asli operator">Struk asli</a>`:''}<button class="row-preview" data-preview="${r.id}" aria-label="Pratinjau transaksi">Lihat struk</button>`;
 const value=(r,key)=>key==='fare'||key==='balance'?money(r[key]??null):e(resultValue(r,key));
 const groups=Object.keys(operators).map(op=>({op,items:list.filter(r=>r.operator===op)})).filter(g=>g.items.length);
 $('table-container').innerHTML=groups.map(({op,items})=>`<section class="operator-results"><h3>${e(operatorName(op))}</h3><div class="operator-scroll"><table><thead><tr><th><span class="sr-only">Pilih</span></th>${resultColumns[op].map(([,label])=>`<th>${e(label)}</th>`).join('')}<th>Tindakan</th></tr></thead><tbody>${items.map(r=>`<tr><td>${check(r)}</td>${resultColumns[op].map(([key])=>`<td class="operator-data ${['fare','balance'].includes(key)?'fare':''}">${value(r,key)}</td>`).join('')}<td>${preview(r)}</td></tr>`).join('')}</tbody></table></div></section>`).join('');
 $('transaction-cards').innerHTML=groups.map(({op,items})=>`<section class="operator-results"><h3>${e(operatorName(op))}</h3>${items.map(r=>`<article class="transaction-card"><div class="transaction-card-head">${check(r)}${badge(r)}</div><dl>${resultColumns[op].map(([key,label])=>`<dt>${e(label)}</dt><dd class="operator-data">${value(r,key)}</dd>`).join('')}</dl>${preview(r)}</article>`).join('')}</section>`).join('');
 $('table-container').hidden=view!=='table'||!list.length;$('transaction-cards').hidden=view!=='card'||!list.length;$('empty-results').hidden=!!list.length;
 $('empty-title').textContent=loading?'Mencari jejak perjalanan…':statuses.every(s=>s.status==='error')?'Operator belum dapat dihubungi':'Belum ada transaksi untuk pilihan ini';
 $('empty-message').textContent=loading?'Hasil akan muncul saat setiap operator selesai merespons.':'Periksa nomor kartu, tanggal, dan status operator di atas. Anda juga bisa mencoba situs resmi.';
 $('visible-count').textContent=`${list.length} transaksi ditampilkan`;
 document.querySelectorAll('[data-select]').forEach(c=>c.onchange=()=>{c.checked?selected.add(c.dataset.select):selected.delete(c.dataset.select);render();});document.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>showPreview(rows.filter(r=>r.id===b.dataset.preview)));
 selection();
}
$('select-all').onchange=()=>{visible().forEach(r=>$('select-all').checked?selected.add(r.id):selected.delete(r.id));render();};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(t=>t.classList.toggle('selected',t===b));render();});
$('sort').onchange=render;
for(const mode of ['table','card']){$(mode+'-view').classList.toggle('selected',view===mode);$(mode+'-view').setAttribute('aria-pressed',String(view===mode));}
for(const mode of ['table','card'])$(mode+'-view').onclick=()=>{view=mode;for(const m of ['table','card']){$(m+'-view').classList.toggle('selected',m===mode);$(m+'-view').setAttribute('aria-pressed',String(m===mode));}render();};
$('search-form').onsubmit=async event=>{
 event.preventDefault();$('form-error').hidden=true;
 const q={card:$('card').value.replace(/\D/g,''),start:$('start').value,end:$('end').value};
 let error=!/^\d{15,16}$/.test(q.card)?'Masukkan nomor kartu 15–16 digit.':!q.start||!q.end?'Lengkapi tanggal mulai dan akhir.':q.start.startsWith('0000')||q.end.startsWith('0000')?'Tahun tidak valid.':q.start>q.end?'Tanggal mulai harus sebelum tanggal akhir.':q.end>today()?'Tanggal akhir tidak boleh melewati hari ini.':'';
 let periods;try{periods=searchWindows(q.start,q.end);}catch{error=error||'Tanggal tidak valid.';}
 if(error){$('form-error').textContent=error;$('form-error').hidden=false;return;}
 trackEvent('toll_search_start');controller?.abort();controller=new AbortController();const active=controller;query=q;rows=[];selected.clear();loading=true;
 const ops=$('operator').value==='all'?Object.keys(operators):[$('operator').value];statuses=ops.map(op=>({source:op,name:operatorName(op),status:'pending'}));
 $('results').hidden=false;$('query-summary').textContent=`Kartu •••• ${q.card.slice(-4)} · ${q.start} — ${q.end}`;$('retention-note').hidden=!ops.includes('astra')||(Date.parse(today())-Date.parse(q.start))/86400000<=30;$('search-button').disabled=true;render();$('results').scrollIntoView({behavior:'smooth',block:'start'});
 const jobs=periods.flatMap(period=>ops.map(operator=>({...period,operator})));let completed=0;const sourceTotals=new Map();
 $('search-progress').hidden=false;$('progress-bar').max=jobs.length;$('progress-bar').value=0;$('stop-search').disabled=false;
 const updateProgress=()=>{$('progress-label').textContent=`${completed} dari ${jobs.length} tahap selesai`;$('progress-bar').value=completed;};updateProgress();
 try{
  for(const job of jobs){
   if(active.signal.aborted)break;
   $('progress-detail').textContent=`${operatorName(job.operator)} · ${job.start} — ${job.end}${completed?' · Mengambil arsip berikutnya…':''}`;
   // Ten requests/minute leaves room under the server's 12/minute safety limit.
   if(completed)await abortableDelay(6100,active.signal);
   const data=await searchWithRetry({...q,...job},{signal:active.signal,onRetry:(attempt,wait)=>{trackEvent('toll_search_retry');$('progress-detail').textContent=`${operatorName(job.operator)} · Coba ulang ${attempt}/2 dalam ${Math.ceil(wait/1000)} detik…`;}});if(controller!==active)return;
   const previousCount=rows.length;rows=mergeTransactions(rows,data.transactions);
   if(data.nextPage){if(rows.length===previousCount){for(const source of data.sources){source.status='partial';source.message='Operator mengulang halaman yang sama; buka situs resmi untuk memeriksa kelengkapan.';}}else{jobs.splice(completed+1,0,{...job,page:data.nextPage});$('progress-bar').max=jobs.length;}}
   for(const source of data.sources){
    const total=sourceTotals.get(source.source)||{...source,count:0,failed:[],partial:[],checked:0};total.checked++;
    if(source.status==='error')total.failed.push(`${job.start} — ${job.end}: ${source.message}`);
    if(source.status==='partial')total.partial.push(`${job.start} — ${job.end}: ${source.message}`);
    total.count=rows.filter(r=>r.source===source.source).length;
    total.status=total.failed.length===total.checked?'error':total.failed.length||total.partial.length?'partial':'success';
    total.message=[`${total.count} transaksi ditemukan.`,...total.failed,...total.partial].join(' ');sourceTotals.set(source.source,total);
   }
   statuses=[...sourceTotals.values()];completed++;updateProgress();render();
  }
 }catch(err){
  if(controller!==active)return;
  if(err.name!=='AbortError'){$('progress-detail').textContent=err.message;toast(err.message);}
 }finally{
  if(controller===active){loading=false;$('search-button').disabled=false;$('stop-search').disabled=true;updateProgress();
   statuses=statuses.map(s=>s.status==='pending'?{...s,status:'partial',message:'Belum selesai diperiksa.'}:s);
   if(active.signal.aborted)trackEvent('toll_search_cancelled');
   else if(completed===jobs.length&&statuses.every(s=>s.status==='success'))trackEvent('toll_search_success');
   else trackEvent(rows.length?'toll_search_partial':'toll_search_failed');
   if(completed===jobs.length)$('progress-detail').textContent='Pencarian selesai. Hasil mencakup arsip yang dikembalikan operator; periksa status sumber untuk periode yang gagal.';
   else {$('progress-label').textContent=`Pencarian belum lengkap · ${completed}/${jobs.length} tahap`;$('progress-detail').textContent=active.signal.aborted?'Pencarian dihentikan. Hasil yang sudah ditemukan tetap tersedia.':$('progress-detail').textContent;}
   render();
  }
 }

};
$('stop-search').onclick=()=>controller?.abort();
$('clear-results').onclick=()=>{controller?.abort();controller=null;rows=[];statuses=[];query=null;selected.clear();previewRows=[];$('receipt-pages').replaceChildren();$('receipt-dialog').close();$('results').hidden=true;$('search-progress').hidden=true;$('search-button').disabled=false;loading=false;};
let previewEnlarged=false;
function fitReceipt(){const scroll=$('receipt-pages').parentElement;const width=scroll.clientWidth-parseFloat(getComputedStyle(scroll).paddingLeft)-parseFloat(getComputedStyle(scroll).paddingRight);$('receipt-pages').style.zoom=previewEnlarged?1.5:Math.min(1,width/794);$('preview-size').textContent=previewEnlarged?'Pas layar':'Perbesar';$('preview-size').setAttribute('aria-pressed',String(previewEnlarged));}
new ResizeObserver(()=>{if($('receipt-dialog').open)fitReceipt();}).observe($('receipt-dialog'));
$('preview-size').onclick=()=>{previewEnlarged=!previewEnlarged;fitReceipt();};
function showPreview(list){previewRows=list;previewEnlarged=false;$('receipt-pages').innerHTML=receiptPages(list,query);$('receipt-dialog').showModal();fitReceipt();}
$('preview').onclick=()=>showPreview(rows.filter(r=>selected.has(r.id)));$('close-dialog').onclick=()=>$('receipt-dialog').close();
let timer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,6000);}
async function download(list,format='pdf'){if(exporting)return;exporting=true;selection();toast(`Menyiapkan ${format==='xlsx'?'Excel':format.toUpperCase()}…`);try{if(format==='pdf'){await savePDF(list,{...query});trackEvent('toll_pdf_download');}else {saveSpreadsheet(list,format);trackEvent(format==='csv'?'toll_csv_download':'toll_excel_download');}toast('File siap. Periksa unduhan browser Anda.');}catch(err){trackEvent('toll_download_failed');toast(err.message||'File gagal dibuat. Coba lagi.');}finally{exporting=false;selection();}}
$('export-format').onchange=()=>{$('download').setAttribute('aria-label','Unduh '+({pdf:'PDF',csv:'CSV',xlsx:'Excel'}[$('export-format').value]));};
$('download').onclick=()=>download(rows.filter(r=>selected.has(r.id)),$('export-format').value);

setupDisplayPreferences();
