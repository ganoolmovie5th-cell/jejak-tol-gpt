import {load} from 'cheerio';
export const CTP_SOURCE='https://www.ctptollways.co.id/tarif';
export const CTP_ROAD='Cibitung-Cilincing';
export function parseCtpTariffs(html){
 const $=load(html),table=$('table').filter((_,t)=>$(t).find('th').map((_,h)=>$(h).text().replace(/\s+/g,' ').trim()).get().join('|')==='Asal|Tujuan|Gol. I|Gol. II|Gol. III|Gol. IV|Gol. V');
 if(table.length!==1)throw Error('Format tarif CTP berubah');
 const rows=[],pairs=new Set();
 for(const tr of table.find('tbody tr').toArray()){
  const cells=$(tr).find('td').map((_,td)=>$(td).text().trim()).get();
  if(cells.length!==7||!cells[0]||!cells[1]||cells[0]===cells[1])throw Error('Baris tarif CTP tidak valid');
  const all=cells.slice(2).map(v=>/^Rp\s*\d{1,3}(?:\.\d{3})*$/.test(v)?Number(v.replace(/[^\d]/g,'')):NaN);
  if(all.some(v=>!Number.isSafeInteger(v)||v<=0)||all[1]!==all[2]||all[3]!==all[4])throw Error('Golongan tarif CTP tidak valid');
  const key=`${cells[0]}|${cells[1]}`;if(pairs.has(key))throw Error('Pasangan CTP duplikat');pairs.add(key);
  rows.push({region:'Jabodetabek',road:CTP_ROAD,origin:cells[0],destination:cells[1],fares:[all[0],all[1],all[3]],source:CTP_SOURCE});
 }
 if(!rows.length)throw Error('Tarif CTP kosong');return rows;
}
