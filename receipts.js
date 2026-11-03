export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = n => n === null ? '—' : new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const dateLabel = s => new Date(s).toLocaleString('id-ID',{dateStyle:'full',timeStyle:'short'});
const rupiah=(n,astra=false)=>n===null?'—':`${astra?'Rp.':'Rp'} ${new Intl.NumberFormat('id-ID').format(n)}`;
const groupCard=(card,separator='-')=>card.replace(/(.{4})(?=.)/g,'$1'+separator);
const logos={mms:'logo_header-grayscale.png',mhi:'mhi-grayscale.png',lms:'lms-grayscale.png'};
const calls={mms:'Layanan Toll (Free Call) : 0-800-1-777-879',mhi:'Info Tol. (0321) 888 123',lms:'Info Tol. (0260) 7600 600'};
export function overloadInstruction(r){
 if(!r.overload||r.source!=='mms')return '';
 const targets={'Cilegon Timur':'Cilegon Barat','Cilegon Barat':'Cilegon Timur','Serang Barat':'Serang Timur','Serang Timur':'Serang Barat','Merak':'Cilegon Timur','Cikande':'Ciujung','Cikupa':'Balaraja Timur','Cikupa 1':'Balaraja Timur','Cikupa 2':'Balaraja Timur','Cikupa 3':'Balaraja Timur','Cikupa 4':'Balaraja Timur','Balaraja Timur':'Balaraja Barat','Balaraja Barat':'Balaraja Timur'};
 const gate=targets[r.entry];return gate&&gate!==r.exit?`Anda Harus Keluar Gerbang ${gate}`:'';
}
function astraDate(value){const [day,time]=value.split('T');const [year,month,date]=day.split('-').map(Number);return new Intl.DateTimeFormat('id-ID',{weekday:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,date)))+', '+date+' '+new Intl.DateTimeFormat('id-ID',{month:'long',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,date)))+' '+year+' pukul '+time.slice(0,5).replace(':','.');}
function astraTicket(r){const e=escapeHTML;return `<article class="print-ticket"><div class="astra-logo-line"><img src="/assets/${logos[r.source]}" width="200" height="50" alt="${e(r.company)}"></div><div class="print-call">${calls[r.source]}</div><hr class="spaced-rule"><div class="print-gate">GERBANG ${e(r.exit)}</div><div class="print-date caption">${e(astraDate(r.dateTime))}</div><div class="print-sub caption">${r.source==='mms'?'Gologan':'Golongan'} ${e(r.vehicleClass)}, ${r.integrated?'INTEGRASI':`Dari ${e(r.entry)}`}</div><hr><dl class="print-details caption">${[['BANK',r.bank],['No. Kartu',groupCard(r.card)],['Tarif',rupiah(r.fare,true)],['Sisa Saldo',rupiah(r.balance,true)]].map(([k,v])=>`<dt>${k}</dt><dd>${e(v)}</dd>`).join('')}</dl><hr class="bottom-rule"><div class="print-thanks caption">${r.overload&&r.source==='mms'?`<div>Kendaraan Overload Tidak Patuh</div><div class="exit-instruction">${e(overloadInstruction(r))}</div>`:''}<div>Terima Kasih</div></div></article>`;}
function serbaTicket(r,card){const e=escapeHTML;const roman=['','I','II','III','IV','V','VI'][Number(r.vehicleClass)]||r.vehicleClass;return `<article class="serba-ticket"><div class="serba-logo"><img src="/assets/serbaraja.png" alt="Serbaraja"></div><div class="serba-call">Layanan Toll : 021 50502300</div><div class="serba-gate"><strong>${e((r.entry||'GERBANG —').split(' - ')[0])}</strong><div>${e(r.rawDate)}</div><div>Golongan ${e(roman)}${r.exit?`, dari ${e(r.exit)}`:''}</div></div><div class="serba-divider"></div><table class="serba-detail"><tbody>${[['Bank',r.bank],['e-TollCard',groupCard(card,' ')],['Tarif',rupiah(r.fare)],['Sisa Saldo',rupiah(r.balance)],['No. Resi',r.receiptNo||'—']].map(([k,v])=>`<tr><td>${k}</td><td>:</td><td class="${k==='e-TollCard'?'mono':''}">${e(v)}</td></tr>`).join('')}</tbody></table></article>`;}
export function receiptPages(rows,query){
 const e=escapeHTML,pages=[];
 for(const source of ['mms','mhi','lms','serbaraja']){
  // The official Astra export compares the original timestamp strings, including their suffixes.
  const group=rows.filter(r=>r.source===source).sort((a,b)=>source==='serbaraja'?b.dateTime.localeCompare(a.dateTime):b.rawDate.localeCompare(a.rawDate));
  for(let offset=0;offset<group.length;offset+=9){
   const slice=group.slice(offset,offset+9);
   if(source==='serbaraja'){
    pages.push(`<section class="receipt-page serba-page"><div class="serba-info"><div>Card Number: <b class="mono">${e(groupCard(query.card,' '))}</b></div><div>Period: <b>${e(query.start)} — ${e(query.end)}</b></div><div>Total Transactions: <b>${group.length}</b></div></div><div class="serba-grid">${slice.map(r=>serbaTicket(r,query.card)).join('')}</div><div class="serba-footer">Data from serbaraja.sinarmasland.com · Disusun SakuKartu · This is a digital receipt</div></section>`);
   }else{
    pages.push(`<section class="receipt-page astra-page">${offset===0?`<header class="print-heading"><strong>${e(group[0].company)}</strong><span>ASTRA Infra Struk Digital Transaksi Toll</span></header>`:''}<div class="print-grid">${slice.map(astraTicket).join('')}</div>${offset+9>=group.length?`<div class="print-total">Total Transaksi : ${e(rupiah(group.reduce((s,r)=>s+r.fare,0),true))}</div>`:''}</section>`);
   }
  }
 }
 return pages.join('');
}
export async function savePDF(rows,query){
 if(!rows.length)throw new Error('Pilih transaksi terlebih dahulu.');
 if(rows.length>180)throw new Error('Pilih maksimal 180 transaksi per unduhan.');
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 const root=document.getElementById('pdf-render-root');root.innerHTML=receiptPages(rows,query);
 try{
  await document.fonts.ready;await Promise.all([...root.querySelectorAll('img')].map(img=>img.decode()));
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});pdf.setProperties({title:'Struk transaksi tol',author:'SakuKartu',subject:'Disusun dari data operator'});
  const pages=[...root.children];
  for(let i=0;i<pages.length;i++){const canvas=await html2canvas(pages[i],{scale:2,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0,windowWidth:1440});if(i)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',1),'JPEG',0,0,210,297);canvas.width=0;canvas.height=0;}
  pdf.save(`SakuKartu-${query.start}-${query.end}.pdf`);
 }finally{root.replaceChildren();}
}
