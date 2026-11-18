import {writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PUBLIC_GATE_SOURCE,mapTangerangMerakGates} from '../lib/pu-toll-data.mjs';
import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
const query=async params=>{
 const url=new URL(PUBLIC_GATE_SOURCE+'/query');url.search=new URLSearchParams({where:"ruas = 'Tangerang - Merak'",...params});
 const response=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('Public PU gate source unavailable');
 const raw=await response.text();if(raw.length>2000000)throw Error('Public PU gate response too large');return {raw,data:JSON.parse(raw)};
};
const {data:count}=await query({returnCountOnly:'true',f:'json'});
const {raw,data}=await query({outFields:'fid,nama,ruas,status',outSR:'4326',f:'geojson'});
if(!Number.isInteger(count.count)||count.count<10||data.features?.length!==count.count||data.exceededTransferLimit)throw Error('Incomplete public PU gate dataset');
const {rows}=await fetchTripTariffs();const mapped=mapTangerangMerakGates(data,rows);
if(new Set(mapped.gates.map(g=>g.tariffName)).size<10)throw Error('Unexpected mapped gate coverage');
const target=new URL('../data/pu-public-toll-gates.json',import.meta.url),temporary=new URL(target.href+'.tmp');
await writeFile(temporary,JSON.stringify({source:PUBLIC_GATE_SOURCE,retrievedAt:new Date().toISOString(),sha256:createHash('sha256').update(raw).digest('hex'),sourceFeatures:count.count,...mapped},null,2)+'\n');
await rename(temporary,target);console.log(JSON.stringify({gatePoints:mapped.gates.length,tariffBoundaries:new Set(mapped.gates.map(g=>g.tariffName)).size,unmapped:mapped.unmapped}));
