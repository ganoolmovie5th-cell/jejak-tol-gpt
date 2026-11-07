import {load} from 'cheerio';
import {writeFile} from 'node:fs/promises';
const source='https://www.jsb.co.id/calculator';
const response=await fetch(source,{signal:AbortSignal.timeout(15000)});
if(!response.ok)throw Error('Operator gate source unavailable');
const $=load(await response.text()),page=JSON.parse($('#app').attr('data-page')||'null');
const gates=page?.props?.tollGates?.map(g=>({id:`jsb-${g.id}`,name:g.name,lat:Number(g.latitude),lon:Number(g.longitude)}));
if(!Array.isArray(gates)||gates.length<6||gates.some(g=>!g.name||!Number.isFinite(g.lat)||!Number.isFinite(g.lon)||g.lat>6||g.lat< -12||g.lon<94||g.lon>142))throw Error('Invalid operator gate coordinates');
// The source also lists other operators; only the six JSB gates are enabled for automatic fare matching.
const active=new Set(['Kandeman','KIT Batang','Weleri','Kendal','Kaliwungu','Kalikangkung']);
await writeFile(new URL('../data/toll-gates.json',import.meta.url),JSON.stringify({source,checkedAt:new Date().toISOString(),gates:gates.map(g=>({...g,system:active.has(g.name)?'semarang-batang':null}))},null,2)+'\n');
console.log(`Imported ${gates.length} gates; ${active.size} gates enabled for Semarang–Batang.`);
