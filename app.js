import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import {escapeHTML as e,money,dateLabel,receiptPages,savePDF} from './receipts.js';
import {ARCHIVE_START,searchWindows,mergeTransactions,abortableDelay} from './lib/search-plan.mjs';
const $=id=>document.getElementById(id);
let rows=[],statuses=[],selected=new Set(),filter='all',view='table',query=null,previewRows=[],controller=null,loading=false,exporting=false;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function period(days){$('archive-hint').hidden=true;const end=today(),start=new Date(end+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-days+1);$('start').value=start.toISOString().slice(0,10);$('end').value=end;}
period(7);$('start').max=$('end').max=today();
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>period(Number(b.dataset.days)));
$('all-history').onclick=()=>{$('start').value=ARCHIVE_START;$('end').value=today();$('archive-hint').hidden=false;};
$('start').onchange=()=>{$('archive-hint').hidden=$('start').value!==ARCHIVE_START;};
$('card').oninput=()=>{$('card').value=$('card').value.replace(/\D/g,'').slice(0,16).replace(/(.{4})(?=.)/g,'$1 ');};
const visible=()=>rows.filter(r=>filter==='all'||r.operator===filter).sort((a,b)=>$('sort').value==='asc'?a.dateTime.localeCompare(b.dateTime):b.dateTime.localeCompare(a.dateTime));
function selection(){const list=visible();$('selected-count').textContent=`${selected.size} dipilih`;$('select-all').checked=!!list.length&&list.every(r=>selected.has(r.id));$('select-all').indeterminate=list.some(r=>selected.has(r.id))&&!$('select-all').checked;$('preview').disabled=$('download').disabled=!selected.size||exporting;}
function render(){
 const list=visible();$('count').textContent=rows.length;$('total').textContent=money(rows.reduce((s,r)=>s+r.fare,0));$('operator-count').textContent=`${new Set(rows.map(r=>r.operator)).size} operator`;
 for(const op of ['all','astra','serbaraja'])$('tab-'+op).textContent=rows.filter(r=>op==='all'||r.operator===op).length;
 $('source-status').innerHTML=statuses.map(s=>`<div class="source-chip ${s.status==='pending'?'pending':s.status!=='success'?'error-status':''}">${e(s.name)} · ${s.status==='pending'?e(s.message||'Menghubungkan…'):s.status==='success'?`${s.count} transaksi`:e(s.message)}${s.status==='error'?` <a href="${s.source==='serbaraja'?'https://serbaraja.sinarmasland.com/':'https://www.astratol.co.id/'}" target="_blank" rel="noopener noreferrer">Situs resmi ↗</a>`:''}</div>`).join('');
 const check=r=>`<input type="checkbox" data-select="${r.id}" ${selected.has(r.id)?'checked':''} aria-label="Pilih transaksi ${e(r.dateTime)}">`,badge=r=>`<span class="operator-label ${r.operator}">${r.operator==='astra'?'Astra Tol':'Serbaraja'}</span>`,preview=r=>`<button class="row-preview" data-preview="${r.id}" aria-label="Pratinjau transaksi">↗</button>`;
 $('transaction-rows').innerHTML=list.map(r=>`<tr><td>${check(r)}</td><td>${e(r.dateTime.slice(0,10))}<small>${e(r.dateTime.slice(11))}</small></td><td class="route-cell">${e(r.entry||'—')} <span>→</span> ${e(r.exit||'—')}<small>${e(r.road)}${r.integrated?' · Integrasi':''}</small></td><td>${badge(r)}</td><td>${e(r.vehicleClass)}<small>${e(r.bank)}</small></td><td class="right fare">${money(r.fare)}</td><td class="right">${money(r.balance)}</td><td>${preview(r)}</td></tr>`).join('');
 $('transaction-cards').innerHTML=list.map(r=>`<article class="transaction-card"><div class="transaction-card-head">${check(r)}${badge(r)}</div><h3>${e(r.entry||'—')} → ${e(r.exit||'—')}</h3><p>${e(dateLabel(r.dateTime))}</p><p>${e(r.road)}</p><dl><dt>Bank / Golongan</dt><dd>${e(r.bank)} / ${e(r.vehicleClass)}</dd><dt>Tarif</dt><dd>${money(r.fare)}</dd><dt>Sisa saldo</dt><dd>${money(r.balance)}</dd></dl><button class="secondary" data-preview="${r.id}">Lihat struk ↗</button></article>`).join('');
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
for(const mode of ['table','card'])$(mode+'-view').onclick=()=>{view=mode;for(const m of ['table','card']){$(m+'-view').classList.toggle('selected',m===mode);$(m+'-view').setAttribute('aria-pressed',String(m===mode));}render();};
$('search-form').onsubmit=async event=>{
 event.preventDefault();$('form-error').hidden=true;
 const q={card:$('card').value.replace(/\D/g,''),start:$('start').value,end:$('end').value};
 let error=!/^\d{15,16}$/.test(q.card)?'Masukkan nomor kartu 15–16 digit.':!q.start||!q.end?'Lengkapi tanggal mulai dan akhir.':q.start.startsWith('0000')||q.end.startsWith('0000')?'Tahun tidak valid.':q.start>q.end?'Tanggal mulai harus sebelum tanggal akhir.':q.end>today()?'Tanggal akhir tidak boleh melewati hari ini.':'';
 let periods;try{periods=searchWindows(q.start,q.end);}catch{error=error||'Tanggal tidak valid.';}
 if(error){$('form-error').textContent=error;$('form-error').hidden=false;return;}
 controller?.abort();controller=new AbortController();const active=controller;query=q;rows=[];selected.clear();loading=true;
 const ops=$('operator').value==='all'?['astra','serbaraja']:[$('operator').value];statuses=ops.map(op=>({source:op,name:op==='astra'?'Astra Tol':'Serbaraja',status:'pending'}));
 $('results').hidden=false;$('query-summary').textContent=`Kartu •••• ${q.card.slice(-4)} · ${q.start} — ${q.end}`;$('retention-note').hidden=!ops.includes('astra')||(Date.parse(today())-Date.parse(q.start))/86400000<=30;$('search-button').disabled=true;render();$('results').scrollIntoView({behavior:'smooth',block:'start'});
 const jobs=periods.flatMap(period=>ops.map(operator=>({...period,operator})));let completed=0;const sourceTotals=new Map();
 $('search-progress').hidden=false;$('progress-bar').max=jobs.length;$('progress-bar').value=0;$('stop-search').disabled=false;
 const updateProgress=()=>{$('progress-label').textContent=`${completed} dari ${jobs.length} tahap selesai`;$('progress-bar').value=completed;};updateProgress();
 try{
  for(const job of jobs){
   if(active.signal.aborted)break;
   $('progress-detail').textContent=`${job.operator==='astra'?'Astra Tol':'Serbaraja'} · ${job.start} — ${job.end}${completed?' · Mengambil arsip berikutnya…':''}`;
   // Ten requests/minute leaves room under the server's 12/minute safety limit.
   if(completed)await abortableDelay(6100,active.signal);
   const response=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...q,...job}),signal:active.signal});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Pencarian gagal.');if(controller!==active)return;
   rows=mergeTransactions(rows,data.transactions);
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
   if(completed===jobs.length)$('progress-detail').textContent='Pencarian selesai. Hasil mencakup arsip yang dikembalikan operator; periksa status sumber untuk periode yang gagal.';
   else {$('progress-label').textContent=`Pencarian belum lengkap · ${completed}/${jobs.length} tahap`;$('progress-detail').textContent=active.signal.aborted?'Pencarian dihentikan. Hasil yang sudah ditemukan tetap tersedia.':$('progress-detail').textContent;}
   render();
  }
 }

};
$('stop-search').onclick=()=>controller?.abort();
$('clear-results').onclick=()=>{controller?.abort();controller=null;rows=[];statuses=[];query=null;selected.clear();previewRows=[];$('receipt-pages').replaceChildren();$('receipt-dialog').close();$('results').hidden=true;$('search-progress').hidden=true;$('search-button').disabled=false;loading=false;};
function showPreview(list){previewRows=list;$('receipt-pages').innerHTML=receiptPages(list,query);$('receipt-dialog').showModal();}
$('preview').onclick=()=>showPreview(rows.filter(r=>selected.has(r.id)));$('close-dialog').onclick=()=>$('receipt-dialog').close();
let timer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,6000);}
async function download(list){if(exporting)return;exporting=true;selection();$('dialog-download').disabled=true;toast('Menyiapkan PDF…');try{await savePDF(list,{...query});toast('PDF siap. Periksa unduhan browser Anda.');}catch(err){toast(err.message||'PDF gagal dibuat. Coba lagi.');}finally{exporting=false;selection();$('dialog-download').disabled=false;}}
$('download').onclick=()=>download(rows.filter(r=>selected.has(r.id)));$('dialog-download').onclick=()=>download(previewRows);
