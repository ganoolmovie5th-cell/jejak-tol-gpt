import {load} from 'cheerio';
import {operators} from './operator-catalog.mjs';
export function mapOperatorRow(row,operator){
 if(operator==='jtd')return{tgl_transaksi:row.waktu,tarif:row.tarif,saldo:row.saldo,gb_tujuan:row.nama_gerbang,gol:row.golongan??row.gol,bank:row.bank,struk_no:row.resi,no_kartu:row.no_kartu};
 if(operator==='bsd')return{tgl_transaksi:row.transaksi,tarif:row.payment,saldo:row.saldo,gb_tujuan:row.gardu,gol:row.gol,bank:row.bank,no_kartu:row.kartu,struk_no:row.resi};
 if(operator==='makassar')return{tgl_transaksi:row.tanggal,tarif:row.payment,saldo:row.saldo,gb_tujuan:[row.plaza,row.gardu].filter(Boolean).join(' / '),gol:row.gol,bank:row.bank_detail,no_kartu:row.nomor,struk_no:row.resi,mac:row.id};
 if(operator==='citra')return{tgl_transaksi:row.tanggal,tarif:row.tarif,saldo:row.saldo,gb_tujuan:Number(row.gerbang)===4223?'KEBON BAWANG':Number(row.gerbang)===4221?'PISANGAN':String(row.gerbang??''),gol:row.golongan,bank:row.bank==='MDR'?'MANDIRI':row.bank,no_kartu:row.no_kartu,mac:row.id};
 return row;
}
export function parseJlb(html){
 const $=load(html),inputs=$('input[name="checkboxs[]"]'),rows=[];let skipped=0;
 if(!$('#additionalContent').length)throw new Error('Struktur halaman JLB berubah. Buka situs resmi.');
 inputs.each((_,el)=>{
  let box=$(el).parent();for(let i=0;i<6&&box.length;i++,box=box.parent()){
   const text=box.text().replace(/\s+/g,' ').trim();
   if(box.find('input[name="checkboxs[]"]').length>1)break;
   const date=text.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?|\d{2}[/-]\d{2}[/-]\d{4}\s+\d{2}:\d{2}(?::\d{2})?/);
   const fare=text.match(/(?:Tarif|Biaya)\s*:?\s*(?:Rp\.?\s*)?([\d.,]+)/i),balance=text.match(/(?:Sisa\s+Saldo|Saldo)\s*:?\s*(?:Rp\.?\s*)?([\d.,]+)/i);
   if(date&&fare){rows.push({tgl_transaksi:date[0],tarif:fare[1],saldo:balance?.[1],struk_no:$(el).val(),gol:text.match(/Gol(?:ongan)?\s*:?\s*([IVX\d]+)/i)?.[1],bank:text.match(/\b(BNI|BRI|BCA|MANDIRI|DKI)\b/i)?.[1],gb_tujuan:text.match(/Gerbang\s*:?\s*(.*?)(?=Gardu|Golongan|Tanggal|Waktu|Tarif|Saldo|No\.|$)/i)?.[1]?.trim()});return;}
  }
  skipped++;
 });
 return {rows,skipped};
}
export async function searchAdditional(query,fetcher,{normalize,fetchJSON}){
 const {operator,card,start,end,page=1}=query,meta=operators[operator];let raw=[],skipped=0,nextPage=null;
 try{
  if(operator==='jtd'){
   const j=await fetchJSON('https://bc01.jtd.co.id/api/jlp/beranda/struk?'+new URLSearchParams({tglAwal:start,tglAkhir:end,noKartu:card}),{},fetcher);raw=j.data;
  }else if(operator==='bsd'||operator==='makassar'){
   const host=operator==='bsd'?'https://www.bsdtol.com':'https://tolmakassar.com';
   const args=operator==='bsd'?{kartu:card,tanggal_awal:start,tanggal_akhir:end,draw:'1',start:String((page-1)*100),length:'100'}:{kartu:card,tanggal_awal:start+' 00:00:00',tanggal_akhir:end+' 23:59:59',page:String(page)};
   const j=await fetchJSON(host+'/struk?'+new URLSearchParams(args),{headers:{'X-Requested-With':'XMLHttpRequest'}},fetcher);raw=j.data;
   if(Array.isArray(raw)&&raw.length&&(operator==='makassar'?j.next_page_url!==null:(Number(j.recordsFiltered)>(page-1)*100+raw.length)))nextPage=page+1;
  }else if(operator==='citra'){
   const j=await fetchJSON('https://struk.citrapersada.co.id/getStruk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({no_card:card.match(/.{1,4}/g).join('-'),tgl_awal:start+'T00:00:00.000+07:00',tgl_akhir:end+'T00:00:00.000+07:00'})},fetcher);raw=j.query;
  }else if(operator==='jlb'){
   const url=meta.url;const first=await fetcher(url,{signal:AbortSignal.timeout(10000),redirect:'error'});if(!first.ok)throw new Error(`Operator merespons HTTP ${first.status}.`);
   const html=await first.text();const token=load(html)('input[name="_token"]').first().val();if(!token)throw new Error('Formulir JLB tidak tersedia. Buka situs resmi.');
   const cookie=first.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
   const response=await fetcher(url,{method:'POST',signal:AbortSignal.timeout(12000),redirect:'error',headers:{Cookie:cookie,Referer:url,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({_token:token,card_number:card,start_date:start,end_date:end})});
   if(!response.ok)throw new Error(`Operator merespons HTTP ${response.status}.`);const body=await response.text();if(body.length>6000000)throw new Error('Respons terlalu besar. Persempit tanggal.');({rows:raw,skipped}=parseJlb(body));
  }
  if(!Array.isArray(raw))throw new Error('Struktur data operator berubah. Buka situs resmi.');
  const transactions=[];
  for(const row of raw){try{const t=normalize(mapOperatorRow(row,operator),operator,query);if(t){if(operator==='jtd'&&typeof row.link_api==='string'&&row.link_api.startsWith('/')&&!row.link_api.startsWith('//')){const url=new URL(row.link_api,'https://bc01.jtd.co.id');if(url.origin==='https://bc01.jtd.co.id')t.originalReceiptUrl=url.href;};transactions.push(t);}}catch{skipped++;}}
  return{operator,transactions,nextPage,sources:[{source:operator,name:meta.name,status:skipped?'partial':'success',count:transactions.length,message:skipped?`${skipped} transaksi belum dapat dibaca. Gunakan situs resmi untuk detail lengkap.`:''}],fetchedAt:new Date().toISOString()};
 }catch(e){return{operator,transactions:[],sources:[{source:operator,name:meta.name,status:'error',count:0,message:e.name==='TimeoutError'?'Operator belum merespons. Coba lagi atau buka situs resmi.':/^(Operator|Struktur|Formulir|Respons)/.test(e.message)?e.message:'Tidak dapat terhubung ke operator. Coba situs resmi.'}],fetchedAt:new Date().toISOString()};}
}
