import {fetchedTime} from './tariff-display.mjs';
import {escapeHTML as e} from '../receipts.js';
const officialHosts=new Set(['bpjt.pu.go.id','investor.jasamarga.com','investor-id.jasamarga.com','bsdtol.com','www.bsdtol.com','www.jsb.co.id']);
export function officialLink(value,label){
 try{const url=new URL(value);if(url.protocol!=='https:'||!officialHosts.has(url.hostname)||url.username||url.password)return '';return `<a href="${e(url.href)}" target="_blank" rel="noopener noreferrer">${e(label)}</a>`;}catch{return '';}
}
export function tariffProvenance(data){
 const timestamp=data.tariffsAvailable&&data.tariffFetchedAt?fetchedTime(data.tariffFetchedAt):'—';
 return `<details class="trip-provenance"><summary>Sumber &amp; pembaruan tarif</summary><dl><dt>Sumber tarif</dt><dd>${officialLink('https://bpjt.pu.go.id/info-tarif-dan-golongan/','BPJT')}</dd><dt>Data diambil</dt><dd>${e(timestamp)}${timestamp==='—'?'':' WIB'}</dd><dt>Tanggal berlaku tarif</dt><dd>Lihat ketentuan pada sumber resmi</dd></dl><p>Waktu pengambilan bukan tanggal berlaku tarif. Perubahan tarif dan diskon operator mungkin belum tercakup.</p>${timestamp==='—'?'<p>Data tarif tidak berhasil dimuat. Harga yang belum tersedia tidak dianggap gratis.</p>':''}</details>`;
}
