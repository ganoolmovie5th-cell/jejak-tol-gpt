import {load} from 'cheerio';
import {writeFile} from 'node:fs/promises';
const source='https://www.jsb.co.id/calculator';
const response=await fetch(source,{signal:AbortSignal.timeout(15000)});
if(!response.ok)throw Error('Operator gate source unavailable');
const $=load(await response.text()),page=JSON.parse($('#app').attr('data-page')||'null');
const gates=page?.props?.tollGates?.map(g=>({id:`jsb-${g.id}`,name:g.name,lat:Number(g.latitude),lon:Number(g.longitude)}));
if(!Array.isArray(gates)||gates.length<6||gates.some(g=>!g.name||!Number.isFinite(g.lat)||!Number.isFinite(g.lon)||g.lat>6||g.lat< -12||g.lon<94||g.lon>142))throw Error('Invalid operator gate coordinates');
// Only operator coordinates with reviewed BPJT gate names are enabled; logical connections are separate.
const active={
 'semarang-batang':['Kandeman','KIT Batang','Weleri','Kendal','Kaliwungu','Kalikangkung'],
 'cipali':['Kalijati','Subang','Cikedung','Kertajati','Sumberjaya'],
 'pejagan-pemalang':['Brebes Barat','Brebes Timur'],
 'palikanci':['Plumbon 1','Plumbon 2','Ciperna Timur','Ciperna Barat'],
 'kanci-pejagan':['Ciledug 1','Ciledug 2'],
 'pemalang-batang':['Pemalang','Pekalongan','Batang']
};
const tariffNames={'Plumbon 1':'Plumbon','Plumbon 2':'Plumbon','Ciperna Timur':'Ciperna','Ciperna Barat':'Ciperna','Ciledug 1':'Ciledug','Ciledug 2':'Ciledug','Pemalang':'SS Pemalang','Pekalongan':'SS Pekalongan','Batang':'SS Batang'};
await writeFile(new URL('../data/toll-gates.json',import.meta.url),JSON.stringify({source,checkedAt:new Date().toISOString(),gates:gates.map(g=>({...g,...(tariffNames[g.name]?{tariffName:tariffNames[g.name]}:{}),system:Object.entries(active).find(([,names])=>names.includes(g.name))?.[0]||null}))},null,2)+'\n');
console.log(`Imported ${gates.length} gates; ${Object.values(active).flat().length} gates enabled across reviewed systems.`);
