import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
import {systems} from '../lib/toll-network.mjs';
import gates from '../data/pu-toll-network.json' with {type:'json'};
import mainlines from '../data/toll-mainlines.json' with {type:'json'};
const {rows,fetchedAt}=await fetchTripTariffs();
if(!rows.length)throw Error('Audit aborted: BPJT unavailable; empty data is not complete coverage.');
const roads=[...new Set(rows.map(r=>r.road))];
const report={checkedAt:fetchedAt,scope:'Catalogue and mapping audit; not proof of journey pricing coverage',sourceRoads:roads.length,registeredSystems:systems.length,unregisteredRoads:roads.filter(road=>!systems.some(s=>s.rows.includes(road))),systems:systems.map(s=>({id:s.id,type:s.type,tariffRows:rows.filter(r=>s.rows.includes(r.road)).length,gatePoints:gates.gates.filter(g=>g.system===s.id).length,mainlineFeatures:mainlines.roads.filter(r=>r.system===s.id).length})),unmappedGates:gates.unmapped};
console.log(JSON.stringify(report,null,2));
