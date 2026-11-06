export const TARIFF_SOURCE='https://bpjt.pu.go.id/info-tarif-dan-golongan/';
export const TARIFF_CSV='https://docs.google.com/spreadsheets/d/e/2PACX-1vSjht2pWbWOyNXD_wsj4k-zb6l_vgAUj-Nk0sgdUJYZTSwTShSauhcEVYi_UC6rvQ/pub?gid=560628054&single=true&output=csv';
export function parseTariffs(csv){
 const records=[];let row=[],value='',quoted=false;
 for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(!quoted&&(c===','||c==='\n')){row.push(value.trim());value='';if(c==='\n'){records.push(row);row=[];}}else value+=c;}
 if(quoted)throw Error('CSV tidak lengkap.');row.push(value.trim());records.push(row);
 if(!records.some(r=>r[3]==='Ruas')||!records.some(r=>r[5]==='Asal'&&r[7]==='I'))throw Error('Format sumber tarif berubah.');
 const result=[];let region='',road='',origin='';
 const price=s=>/^Rp\s*[\d,]+$/.test(s||'')?Number(s.replace(/[^\d]/g,'')):null;
 for(const r of records){if(r[3]&&r[3]!=='Ruas'){road=r[3];region=r[2];origin='';}if(r[5]&&r[5]!=='Asal')origin=r[5];const fares=r.slice(7,10).map(price);if(road&&fares.length===3&&fares.some(v=>v!==null))result.push({region,road,origin,destination:r[6]||'',fares});}
 if(!result.length)throw Error('Sumber tarif kosong.');return result;
}
