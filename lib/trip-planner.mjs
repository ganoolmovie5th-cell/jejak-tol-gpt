import {escapeHTML as e,money} from '../receipts.js';
export function setupTripPlanner(){
 const $=id=>document.getElementById(id),chosen={},versions={origin:0,destination:0};let calculating=false;
 const status=text=>{$('trip-status').textContent=text;};
 const request=async(body)=>{const response=await fetch('/api/trip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Rute belum dapat dimuat.');return data;};
 for(const type of ['origin','destination']){
  const input=$('trip-'+type),list=$('trip-'+type+'-results'),button=document.querySelector(`[data-place="${type}"]`);
  input.addEventListener('input',()=>{delete chosen[type];versions[type]++;list.replaceChildren();$('trip-result').hidden=true;});
  button.onclick=async()=>{
   if(!input.reportValidity())return;const version=++versions[type];delete chosen[type];list.replaceChildren();button.disabled=true;status('Mencari lokasi…');
   try{const data=await request({action:'places',query:input.value});if(version!==versions[type])return;
    for(const place of data.places){const option=document.createElement('button');option.type='button';option.className='secondary';option.textContent=place.name;option.onclick=()=>{chosen[type]=place.position;input.value=place.name;list.replaceChildren();status('Lokasi dipilih. Lengkapi kedua lokasi lalu hitung rute.');$('trip-result').hidden=true;};list.append(option);}
    status(data.places.length?'Pilih lokasi yang sesuai dari hasil pencarian.':'Lokasi tidak ditemukan. Tambahkan kota atau alamat lebih lengkap.');
   }catch{if(version===versions[type])status('Lokasi belum dapat dimuat. Coba lagi nanti.');}finally{button.disabled=false;}
  };
 }
 $('trip-form').onsubmit=async event=>{
  event.preventDefault();if(calculating)return;if(!chosen.origin||!chosen.destination){status('Cari dan pilih lokasi awal serta tujuan terlebih dahulu.');return;}
  calculating=true;const snapshot=JSON.stringify(chosen);$('trip-submit').disabled=true;$('trip-result').hidden=true;status('Menghitung rute…');
  try{const data=await request({action:'route',...chosen});if(snapshot!==JSON.stringify(chosen))return;
   const rows=data.tolls.map((t,i)=>`<li><div><strong>${e(t.names.join(' · ')||'Ruas tol tanpa nama')}</strong><small><span>Bagian tol</span> ${i+1}</small></div><span>${t.fare===null?'<span>Tarif belum tersedia</span>':money(t.fare)}</span></li>`).join('');
   $('trip-result').innerHTML=`<div class="trip-summary"><div><span>Jarak perjalanan</span><strong>${(data.distance/1000).toFixed(1)} km</strong></div><div><span>Estimasi waktu</span><strong>${Math.ceil(data.duration/60)} <span>menit</span></strong></div><div><span>Estimasi total tol</span><strong>${data.total===null?'<span>Belum lengkap</span>':money(data.total)}</strong></div></div>${data.tolls.length?`<ol class="trip-tolls">${rows}</ol>`:'<p>Tidak ada ruas tol yang terdeteksi pada rute ini.</p>'}${data.total===null?'<p class="tariff-note">Total belum dihitung karena ada tarif yang belum tersedia. Jangan gunakan hasil ini sebagai jumlah saldo yang harus disiapkan.</p>':''}<p><a href="#tariffs">Cek tarif BPJT</a></p>`;
   $('trip-result').hidden=false;status('Rute ditemukan. Estimasi mengikuti rute dan lalu lintas saat pencarian.');
  }catch(error){status(error.name==='TimeoutError'?'Layanan rute terlalu lama merespons. Coba lagi.':error.message);}finally{calculating=false;$('trip-submit').disabled=false;}
 };
}
