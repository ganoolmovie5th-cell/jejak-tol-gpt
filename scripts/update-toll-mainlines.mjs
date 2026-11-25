import {writeFile} from 'node:fs/promises';
import {systems} from '../lib/toll-network.mjs';
import {puKey} from '../lib/pu-toll-data.mjs';
const source='https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SARANA_PRASARANA/MapServer/14';
const url=new URL(source+'/query');url.search=new URLSearchParams({where:"status = 'Operasi'",outFields:'objectid_12,nm_inf,status,thn_data',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.00002',f:'json'});
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Mainline source unavailable');const d=await response.json();
if(d.error||d.exceededTransferLimit||!d.features?.length||d.spatialReference?.wkid!==4326)throw Error('Invalid or incomplete mainlines');
const aliases={palimananplumbonkanci:'palikanci',serpongpondokaren:'bsd',jorrw2utara:'jorr',aksestanjungprioklkrluarjakarta:'jorr',cawangtjpriokpluitjirr:'dalam-kota-jakarta'};
const roads=[];
for(const f of d.features){const p=f.attributes,s=systems.find(s=>s.id===aliases[puKey(p.nm_inf)]||[...s.aliases,...s.rows].some(n=>puKey(n)===puKey(p.nm_inf)));if(!s)continue;
 const paths=f.geometry?.paths;if(!paths?.length||paths.flat().some(p=>!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<94||p[0]>142||p[1]<-12||p[1]>7))throw Error('Invalid mainline coordinates');
 roads.push({id:`big-${p.objectid_12}`,system:s.id,name:p.nm_inf,year:p.thn_data,paths});}
if(roads.length<20)throw Error('Unexpected mainline coverage');await writeFile(new URL('../data/toll-mainlines.json',import.meta.url),JSON.stringify({source,retrievedAt:new Date().toISOString(),roads})+'\n');console.log(`${roads.length} operating mainline features`);
