import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/900.css';
import {escapeHTML as e,money,dateLabel,receiptPages,savePDF} from './receipts.js';
const $=id=>document.getElementById(id);
let rows=[],statuses=[],selected=new Set(),filter='all',view='table',query=null,previewRows=[],controller=null,loading=false,exporting=false;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function period(days){const end=today(),start=new Date(end+'T00:00:00Z');start.setUTCDate(start.getUTCDate()-days+1);$('start').value=start.toISOString().slice(0,10);$('end').value=end;}
period(7);$('start').max=$('end').max=today();
document.querySelectorAll('[data-days]').forEach(b=>b.onclick=()=>period(Number(b.dataset.days)));
$('card').oninput=()=>{$('card').value=$('card').value.replace(/\D/g,'').slice(0,16).replace(/(.{4})(?=.)/g,'$1 ');};
const visible=()=>rows.filter(r=>filter==='all'||r.operator===filter).sort((a,b)=>$('sort').value==='asc'?a.dateTime.localeCompare(b.dateTime):b.dateTime.localeCompare(a.dateTime));
function selection(){const list=visible();$('selected-count').textContent=`${selected.size} dipilih`;$('select-all').checked=!!list.length&&list.every(r=>selected.has(r.id));$('select-all').indeterminate=list.some(r=>selected.has(r.id))&&!$('select-all').checked;$('preview').disabled=$('download').disabled=!selected.size||exporting;}
function render(){
 const list=visible();$('count').textContent=rows.length;$('total').textContent=money(rows.reduce((s,r)=>s+r.fare,0));$('operator-count').textContent=`${new Set(rows.map(r=>r.operator)).size} operator`;
 for(const op of ['all','astra','serbaraja'])$('tab-'+op).textContent=rows.filter(r=>op==='all'||r.operator===op).length;
 $('source-status').innerHTML=statuses.map(s=>`<div class="source-chip ${s.status==='pending'?'pending':s.status!=='success'?'error-status':''}">${e(s.name)} · ${s.status==='pending'?'Menghubungkan…':s.status==='success'?`${s.count} transaksi`:e(s.message)}${s.status==='error'?` <a href="${s.source==='serbaraja'?'https://serbaraja.sinarmasland.com/':'https://www.astratol.co.id/'}" target="_blank" rel="noopener noreferrer">Situs resmi ↗</a>`:''}</div>`).join('');
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
 let error=!/^\d{15,16}$/.test(q.card)?'Masukkan nomor kartu 15–16 digit.':!q.start||!q.end?'Lengkapi tanggal mulai dan akhir.':q.start>q.end?'Tanggal mulai harus sebelum tanggal akhir.':q.end>today()?'Tanggal akhir tidak boleh melewati hari ini.':(Date.parse(q.end)-Date.parse(q.start))/86400000>92?'Pilih rentang maksimal 93 hari.':'';
 if(error){$('form-error').textContent=error;$('form-error').hidden=false;return;}
 controller?.abort();controller=new AbortController();const active=controller;query=q;rows=[];selected.clear();loading=true;
 const ops=$('operator').value==='all'?['astra','serbaraja']:[$('operator').value];statuses=ops.map(op=>({source:op,name:op==='astra'?'Astra Tol':'Serbaraja',status:'pending'}));
 $('results').hidden=false;$('query-summary').textContent=`Kartu •••• ${q.card.slice(-4)} · ${q.start} — ${q.end}`;$('retention-note').hidden=!ops.includes('astra')||(Date.parse(today())-Date.parse(q.start))/86400000<=30;$('search-button').disabled=true;render();$('results').scrollIntoView({behavior:'smooth',block:'start'});
 await Promise.all(ops.map(async operator=>{try{const response=await fetch('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...q,operator}),signal:active.signal});const data=await response.json();if(!response.ok)throw new Error(data.error||'Pencarian gagal.');if(controller!==active)return;rows.push(...data.transactions);statuses=statuses.filter(s=>s.source!==operator).concat(data.sources);}catch(err){if(controller!==active)return;statuses=statuses.map(s=>s.source===operator?{...s,status:'error',message:err.message}:s);}if(controller===active)render();}));
 if(controller===active){loading=false;$('search-button').disabled=false;render();}
};
$('clear-results').onclick=()=>{controller?.abort();controller=null;rows=[];statuses=[];query=null;selected.clear();previewRows=[];$('receipt-pages').replaceChildren();$('receipt-dialog').close();$('results').hidden=true;$('search-button').disabled=false;loading=false;};
function showPreview(list){previewRows=list;$('receipt-pages').innerHTML=receiptPages(list,query);$('receipt-dialog').showModal();}
$('preview').onclick=()=>showPreview(rows.filter(r=>selected.has(r.id)));$('close-dialog').onclick=()=>$('receipt-dialog').close();
let timer;function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,6000);}
async function download(list){if(exporting)return;exporting=true;selection();$('dialog-download').disabled=true;toast('Menyiapkan PDF…');try{await savePDF(list,{...query});toast('PDF siap. Periksa unduhan browser Anda.');}catch(err){toast(err.message||'PDF gagal dibuat. Coba lagi.');}finally{exporting=false;selection();$('dialog-download').disabled=false;}}
$('download').onclick=()=>download(rows.filter(r=>selected.has(r.id)));$('dialog-download').onclick=()=>download(previewRows);
