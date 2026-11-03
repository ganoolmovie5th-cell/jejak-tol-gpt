export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money = n => n === null ? '—' : new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
export const dateLabel = s => new Date(s).toLocaleString('id-ID',{dateStyle:'full',timeStyle:'short'});
const logos={mms:'logo_header-grayscale.png',mhi:'mhi-grayscale.png',lms:'lms-grayscale.png',serbaraja:'serbaraja.png'};
const calls={mms:'Layanan Toll (Free Call) : 0-800-1-777-879',mhi:'Info Tol. (0321) 888 123',lms:'Info Tol. (0260) 7600 600',serbaraja:'Layanan Toll : 021 50502300'};
export function receiptPages(rows,query){
 const e=escapeHTML,pages=[];
 for(const source of ['mms','mhi','lms','serbaraja']){
  const group=rows.filter(r=>r.source===source),serba=source==='serbaraja';
  for(let offset=0;offset<group.length;offset+=9){
   const slice=group.slice(offset,offset+9);
   pages.push(`<section class="receipt-page ${serba?'serba-page':'astra-page'}"><header class="print-heading"><strong>${e(group[0].company)}</strong><span>${serba?'Digital Toll Receipt':'ASTRA Infra Struk Digital Transaksi Toll'}</span></header>${serba?`<div class="print-info">Card Number: ${e(query.card)} &nbsp; Period: ${e(query.start)} – ${e(query.end)} &nbsp; Total Transactions: ${group.length}</div>`:''}<div class="print-grid">${slice.map(r=>`<article class="print-ticket"><img class="print-logo" src="/assets/${logos[source]}" alt="${e(r.company)}"><p class="print-call">${calls[source]}</p><hr><h3>GERBANG ${e(serba?r.entry.split(' - ')[0]:r.exit)}</h3><p class="print-date">${e(dateLabel(r.dateTime))}</p><p class="print-sub">Golongan ${e(r.vehicleClass)} · ${r.integrated?'INTEGRASI':`Dari ${e(serba?r.exit:r.entry)}`}</p><hr><dl>${[['Bank',r.bank],['No. Kartu',r.card.replace(/(.{4})(?=.)/g,'$1-')],['Tarif',money(r.fare)],['Sisa Saldo',money(r.balance)],...(serba?[['No. Resi',r.receiptNo]]:[])].map(([k,v])=>`<dt>${k}</dt><dd>${e(v)}</dd>`).join('')}</dl><hr><p class="print-thanks">Terima Kasih${r.overload?'<br>KENDARAAN MELEBIHI BATAS MUATAN':''}</p></article>`).join('')}</div>${offset+9>=group.length?`<p class="print-total">Total Transaksi : ${e(money(group.reduce((s,r)=>s+r.fare,0)))}</p>`:''}<footer class="print-provenance">Disusun SakuKartu dari data ${serba?'Serbaraja':'Astra Tol'} · ${offset/9+1}/${Math.ceil(group.length/9)}</footer></section>`);
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
  for(let i=0;i<pages.length;i++){const canvas=await html2canvas(pages[i],{scale:2,backgroundColor:'#ffffff',logging:false});if(i)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',.95),'JPEG',0,0,210,297);canvas.width=0;canvas.height=0;}
  pdf.save(`SakuKartu-${query.start}-${query.end}.pdf`);
 }finally{root.replaceChildren();}
}
