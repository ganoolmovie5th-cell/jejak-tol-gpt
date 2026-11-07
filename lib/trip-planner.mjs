import {officialLink,tariffProvenance} from './tariff-provenance.mjs';
import {escapeHTML as e,money} from '../receipts.js';
export function setupTripPlanner(){
 const $=id=>document.getElementById(id),chosen={},versions={origin:0,destination:0};let calculating=false;
 const status=text=>{$('trip-status').textContent=text;};
 const request=async(body)=>{const response=await fetch('/api/trip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Rute belum dapat dimuat.');return data;};
 for(const type of ['origin','destination']){
  const input=$('trip-'+type),list=$('trip-'+type+'-results'),button=document.querySelector(`[data-place="${type}"]`);
  input.addEventListener('input',()=>{delete chosen[type];versions[type]++;list.replaceChildren();$('trip-'+type+'-selected').hidden=true;$('trip-result').hidden=true;});
  button.onclick=async()=>{
   if(!input.reportValidity())return;const version=++versions[type];delete chosen[type];list.replaceChildren();button.disabled=true;status('Mencari lokasi…');
   try{const data=await request({action:'places',query:input.value});if(version!==versions[type])return;
    for(const place of data.places){const option=document.createElement('button');option.type='button';option.className='secondary';option.textContent=place.name;option.onclick=()=>{chosen[type]=place.position;input.value=place.name.split(' · ')[0];$('trip-'+type+'-selected').textContent=place.name;$('trip-'+type+'-selected').hidden=false;list.replaceChildren();status('Lokasi dipilih. Lengkapi kedua lokasi lalu hitung rute.');$('trip-result').hidden=true;};list.append(option);}
    status(data.places.length?'Pilih lokasi yang sesuai dari hasil pencarian.':'Lokasi tidak ditemukan. Tambahkan kota atau alamat lebih lengkap.');
   }catch(error){if(version===versions[type])status(error.name==='TimeoutError'?'Layanan rute terlalu lama merespons. Coba lagi.':error.message);}finally{button.disabled=false;}
  };
 }
 $('trip-form').onsubmit=async event=>{
  event.preventDefault();if(calculating)return;if(!chosen.origin||!chosen.destination){status('Cari dan pilih lokasi awal serta tujuan terlebih dahulu.');return;}
  calculating=true;const snapshot=JSON.stringify(chosen);$('trip-submit').disabled=true;$('trip-result').hidden=true;status('Menghitung rute…');
  try{const data=await request({action:'route',...chosen});if(snapshot!==JSON.stringify(chosen))return;
   const charges=data.tolls.flatMap((t,i)=>(t.charges||[{name:t.names.join(' · '),fare:t.fare}]).map(c=>({...c,section:i+1,exitRoads:t.exitRoads})));
   const rows=charges.map(c=>`<li><div><strong>${e(c.name||'Ruas tanpa nama')}</strong>${c.entry&&c.exit?`<small><span>Gerbang masuk</span>: ${e(c.entry)} · <span>Gerbang keluar</span>: ${e(c.exit)}</small>`:`<small>${c.type==='open'?'<span>Tarif satu sistem pembayaran</span>':'<span>Bagian tol</span> '+c.section}</small>`}${c.reason?`<small>${e(c.reason)}</small>`:''}${c.systemId?`<small class="trip-source-links">${officialLink(c.source,'Sumber tarif')}${officialLink(c.ruleSource,c.type==='closed'?'Sumber data gerbang':'Aturan pembayaran')}</small>`:''}</div><span>${c.fare===null?'<span class="trip-unpriced">Belum dapat dihitung</span>':money(c.fare)}</span></li>`).join('');
   $('trip-result').innerHTML=`<div class="trip-summary"><div><span>Jarak perjalanan</span><strong>${(data.distance/1000).toFixed(1)} km</strong></div><div><span>Estimasi waktu</span><strong>${Math.ceil(data.duration/60)} <span>menit</span></strong></div>${data.total===null?`<div><span>Biaya yang sudah terhitung</span><strong>${money(data.knownSubtotal||0)}</strong><small>Bukan total perjalanan</small></div>`:`<div><span>Estimasi total tol</span><strong>${money(data.total)}</strong></div>`}</div>${data.total===null?'<div class="trip-fare-notice"><strong>Rute tersedia, biaya tol belum dapat dihitung</strong><p>Sebagian ruas atau pasangan gerbang belum terpetakan. Biaya yang tersedia ditampilkan per sistem pembayaran; total perjalanan belum dapat dipastikan.</p><a class="secondary" href="#tariffs">Cek tarif BPJT</a></div>':''}${data.tolls.length?`<ol class="trip-tolls">${rows}</ol>`:'<p>Tidak ada ruas tol yang terdeteksi pada rute ini.</p>'}${tariffProvenance(data)}`;
   $('trip-result').hidden=false;status('Rute ditemukan. Estimasi mengikuti rute dan lalu lintas saat pencarian.');
  }catch(error){status(error.name==='TimeoutError'?'Layanan rute terlalu lama merespons. Coba lagi.':error.message);}finally{calculating=false;$('trip-submit').disabled=false;}
 };
}
