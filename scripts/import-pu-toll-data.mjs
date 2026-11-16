import overrides from '../data/pu-status-overrides.json' with {type:'json'};
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tariffGateName} from '../lib/tariff-gate-name.mjs';
import {systems} from '../lib/toll-network.mjs';
import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
import {readPuFeatures,puKey} from '../lib/pu-toll-data.mjs';
const args=process.argv.slice(2);if(args.length!==2)throw Error('Supply gates.geojson and junctions.geojson');
const raw=await Promise.all(args.map(p=>readFile(p,'utf8'))),features=raw.map(JSON.parse);
const gates=readPuFeatures(features[0],'Point');
for(const [id,name] of Object.entries(overrides.gates)){const f=features[0].features.find(f=>String(f.id)===id);if(!f||f.properties.nama!==name||f.properties.ruas!=='Serpong Balaraja')throw Error('Reviewed Serbaraja gate identity changed');if(f.properties.status!=='Operasi')gates.push(f);}
const junctions=readPuFeatures(features[1],'MultiLineString');
const {rows}=await fetchTripTariffs();if(!rows.length)throw Error('Cannot map names without BPJT tariffs');
const roadAliases={palimananplumbonkanci:'palikanci',serpongbalarajaseksi1a:'serbaraja'};
const roadSystem=road=>systems.find(s=>s.id===roadAliases[puKey(road)]||[...s.aliases,...s.rows].some(n=>puKey(n)===puKey(road)));
const aliases={'KALIANGKUNG':'Semarang/Kalikangkung','NGEMPLAK':'Solo/Ngemplak','ADI SUMARMO':'Bandara Adi Sumarmo','GONDANGREJO':'Purwodadi','CARUBAN':'IC Caruban','MADIUN':'IC Madiun','NGANJUK':'IC Nganjuk','KERTAJATI - BANDARA':'Kertajati Utama','WARUGUNUNG':'WRR / Warugunung'};
const contextual={'surabaya-gempol':{'KOTA SATELIT':'Dupak','BANYU URIP':'Dupak','GUNUNG SARI 1':'Dupak','GUNUNG SARI 2':'Dupak','WARU UTAMA':'Waru','KEJAPANAN UTAMA':'Kejapanan'},'serbaraja':{'CBD 1':'SS CBD','CBD 2':'SS CBD','CBD 3':'SS CBD','LEGOK':'SS Legok'},'surabaya-mojokerto':{'WARU 5':'Waru (Terbuka)','WARU 4B':'Waru (Terbuka)','WARU 6':'Waru (Terbuka)','DRIYOREJO 4 RAMP 302':'Driyorejo','DRIYOREJO 3 RAMP 302':'Driyorejo','DRIYOREJO 2 RAMP 305':'Driyorejo','DRIYOREJO 1 RAMP 304':'Driyorejo'},'pemalang-batang':{'PEMALANG':'SS Pemalang','PEKALONGAN':'SS Pekalongan','BATANG':'SS Batang'},'palikanci':{'CIPERNA BARAT':'Ciperna','CIPERNA TIMUR':'Ciperna'},'pejagan-pemalang':{'TEGAL':'Tegal Timur'}};
const enabled=[],unmapped=[];
for(const f of gates){const p=f.properties,s=roadSystem(p.ruas);if(!s||!['closed','mixed','zoned'].includes(s.type))continue;
 const name=p.nama.replace(/^GT\s+/,'').trim(),candidate=contextual[s.id]?.[name]||aliases[name]||name.replace(/\s+\d+$/,'');
 const names=[...new Set(rows.filter(r=>s.rows.includes(r.road)).flatMap(r=>[r.origin,r.destination]).map(tariffGateName))],matches=names.filter(n=>puKey(n)===puKey(tariffGateName(candidate)));
 if(matches.length!==1){unmapped.push({id:f.id,road:p.ruas,name:p.nama});continue;}
 enabled.push({id:`pu-${f.id}`,name:p.nama,tariffName:matches[0],system:s.id,lon:f.geometry.coordinates[0],lat:f.geometry.coordinates[1],source:'https://sigi.pu.go.id/geoapi/',...(p.status!=='Operasi'?{originalStatus:p.status,statusSource:overrides.source}: {})});
}
const mapped=junctions.flatMap(f=>{const s=roadSystem(f.properties.ruas);return s?[{id:`pu-${f.id}`,system:s.id,name:f.properties.nama,paths:f.geometry.type==='LineString'?[f.geometry.coordinates]:f.geometry.coordinates}]:[];});
const result={source:'https://sigi.pu.go.id/geoapi/',importedAt:new Date().toISOString(),files:raw.map((t,i)=>({name:i?'Simpang Susun Tol':'Gerbang Tol',sha256:createHash('sha256').update(t).digest('hex'),features:features[i].features.length,operating:features[i].features.filter(f=>f.properties.status==='Operasi').length})),gates:enabled,junctions:mapped,unmapped};
await writeFile(new URL('../data/pu-toll-network.json',import.meta.url),JSON.stringify(result)+'\n');
console.log(JSON.stringify({gates:enabled.length,junctions:mapped.length,unmapped:unmapped.length}));
