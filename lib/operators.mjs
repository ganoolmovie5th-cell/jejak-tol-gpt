import { createHash } from 'node:crypto';

export const sources = {
  mms: { name: 'Astra · Tangerang–Merak', code: 'AITR001', company: 'PT Marga Mandalasakti', road: 'Tangerang–Merak' },
  mhi: { name: 'Astra · Jombang–Mojokerto', code: 'AITR002', company: 'PT Marga Harjaya Infrastruktur', road: 'Jombang–Mojokerto' },
  lms: { name: 'Astra · Cikopo–Palimanan', code: 'AITR003', company: 'PT Lintas Marga Sedaya', road: 'Cikopo–Palimanan' },
  serbaraja: { name: 'Serbaraja', company: 'PT. Trans Bumi Serbaraja', road: 'Serpong–Balaraja' }
};
export function validateQuery(input) {
  if (!input || typeof input !== 'object') throw new Error('Data pencarian tidak valid.');
  const card = String(input.card ?? '').replace(/[\s-]/g, '');
  if (!/^\d{15,16}$/.test(card)) throw new Error('Nomor kartu harus terdiri dari 15–16 digit.');
  const { start, end, operator } = input;
  if (!['astra','serbaraja'].includes(operator)) throw new Error('Operator belum tersedia.');
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
  if (!validDate(start) || !validDate(end)) throw new Error('Tanggal tidak valid.');
  if (start > end) throw new Error('Tanggal mulai harus sebelum atau sama dengan tanggal akhir.');
  if ((Date.parse(end)-Date.parse(start))/86400000 > 92) throw new Error('Pilih rentang maksimal 93 hari.');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (end > today) throw new Error('Tanggal akhir tidak boleh melewati hari ini.');
  return { card, start, end, operator };
}
export function amount(v) {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? v : null;
  if (typeof v !== 'string' || !v.trim()) return null;
  let s = v.replace(/Rp\.?\s*/gi,'').replace(/\s/g,'');
  // Indonesian thousands separators, or plain API decimal values.
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s=s.replaceAll('.','').replace(',','.');
  else if (/^\d+(,\d{1,2})$/.test(s)) s=s.replace(',','.');
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s=s.replaceAll(',','');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n=Number(s);return Number.isFinite(n) ? n : null;
}
const text = v => typeof v === 'string' || typeof v === 'number' ? String(v).slice(0,240) : '';
export function localDateTime(v) {
  const s=text(v);
  // Operator timestamps are displayed as their wall-clock fields, as in the current official UIs.
  let m=s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if(m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]||'00'}`;
  m=s.match(/^(\d{2})[/-](\d{2})[/-](\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:${m[6]||'00'}` : '';
}
export function normalize(row, source, query) {
  if(!row || typeof row!=='object') throw new Error('Baris transaksi tidak valid.');
  const serba=source==='serbaraja';const meta=sources[source];
  const rawCard=text(serba?row['e-tollcardNum']:row.no_kartu).replace(/[\s-]/g,'');
  // Never return a transaction explicitly belonging to another card.
  if(rawCard && rawCard.replace(/^0+/,'')!==query.card.replace(/^0+/,'')) return null;
  const rawDate=text(serba?row.DateTime:row.tgl_transaksi);
  const dateTime=localDateTime(rawDate);
  if(!dateTime) throw new Error('Format tanggal operator berubah.');
  if(dateTime.slice(0,10)<query.start||dateTime.slice(0,10)>query.end)return null;
  const fare=amount(serba?row.Tarif:row.tarif);
  if(fare===null)throw new Error('Format tarif operator berubah.');
  const receiptNo=text(serba?row.NoResi:row.struk_no);
  const entry=text(serba?row.GerbangAsal:row.gb_asal);
  const exit=text(serba?row.GerbangTujuan:row.gb_tujuan||row.gerbang);
  const id=createHash('sha256').update(JSON.stringify([source,row.mac||receiptNo,rawDate,entry,exit,query.card,fare])).digest('hex').slice(0,24);
  return { id, operator:serba?'serbaraja':'astra', source, company:meta.company, road:meta.road, card:rawCard||query.card, dateTime, rawDate, entry, exit, bank:text(serba?row.Bank:row.bank), vehicleClass:text(serba?row.Golongan:row.gol), fare, balance:amount(serba?row.SisaSaldo:row.saldo), receiptNo, integrated:!serba&&[0,1,3].includes(Number(row.gardu_type)), overload:!serba&&Number(row.ol)===1 };
}
async function fetchJSON(url, options, fetcher) {
  const r=await fetcher(url,{...options,signal:AbortSignal.timeout(18000),redirect:'error',headers:{Accept:'application/json',...options.headers}});
  if(!r.ok) throw new Error(r.status===429?'Operator membatasi permintaan. Coba lagi nanti.':`Operator merespons HTTP ${r.status}.`);
  const body=await r.text();if(body.length>6_000_000)throw new Error('Respons operator terlalu besar. Persempit tanggal.');
  try{return JSON.parse(body);}catch{throw new Error('Operator mengembalikan halaman non-JSON. Coba situs resmi.');}
}
export async function searchOperator(query, fetcher=fetch) {
  const {card,start,end,operator}=query;
  const normalizedCard=card.replace(/^0+/,'');
  const requests=operator==='serbaraja' ? [{source:'serbaraja',url:'https://serbaraja.sinarmasland.com/api/receipt?'+new URLSearchParams({cardNumber:card,dateFrom:start,dateTo:end}),options:{}}] : [
    {source:'mms',url:'https://www.astratol.co.id/api/struk',options:{method:'POST',body:(()=>{const f=new FormData();f.set('keyword',normalizedCard);f.set('periodeAwal',start);f.set('periodeAkhir',end);return f;})()}},
    {source:'mhi',url:`https://api-struk.margaharjaya.co.id/api/v1/etoll/search/${normalizedCard}/${start}/${end}`,options:{}},
    {source:'lms',url:`https://lms.astratol.co.id:2001/api/v1/etoll/search/${normalizedCard}/${start}/${end}`,options:{}}
  ];
  const results=await Promise.all(requests.map(async({source,url,options})=>{
    try{
      const data=await fetchJSON(url,options,fetcher);const rows=source==='serbaraja'?data:data?.data;
      if(!Array.isArray(rows))throw new Error('Struktur data operator berubah. Coba situs resmi.');
      const transactions=[];let skipped=0;
      for(const row of rows){try{const t=normalize(row,source,query);if(t)transactions.push(t);}catch{skipped++;}}
      return {source,name:sources[source].name,status:skipped?'partial':'success',count:transactions.length,message:skipped?`${skipped} transaksi tidak dapat dibaca karena format data berubah.`:'',transactions};
    }catch(e){return {source,name:sources[source].name,status:'error',count:0,message:e.name==='TimeoutError'?'Operator belum merespons dalam 18 detik. Silakan coba lagi.':e.message.startsWith('Operator')||e.message.startsWith('Struktur')||e.message.startsWith('Respons')?e.message:'Tidak dapat terhubung ke operator. Coba lagi atau buka situs resmi.',transactions:[]};}
  }));
  const transactions=[...new Map(results.flatMap(r=>r.transactions).map(t=>[t.id,t])).values()].sort((a,b)=>b.dateTime.localeCompare(a.dateTime));
  return {operator,transactions,sources:results.map(({transactions,...s})=>s),fetchedAt:new Date().toISOString()};
}
