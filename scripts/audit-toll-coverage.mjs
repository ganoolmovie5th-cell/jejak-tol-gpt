import {pathToFileURL} from 'node:url';
import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
import {tariffGateName} from '../lib/tariff-gate-name.mjs';
import {systems} from '../lib/toll-network.mjs';
import gates from '../data/pu-toll-network.json' with {type:'json'};
import operatorGates from '../data/toll-gates.json' with {type:'json'};
import publicGates from '../data/pu-public-toll-gates.json' with {type:'json'};
import mainlines from '../data/toll-mainlines.json' with {type:'json'};
export function auditPairs(rows){
 const pairs=new Map();
 for(const row of rows){const origin=tariffGateName(row.origin),destination=tariffGateName(row.destination);if(!origin||!destination||origin===destination)continue;
  const key=JSON.stringify([row.road,origin,destination]),pair=pairs.get(key)||{road:row.road,origin,destination,fares:[]};pair.fares.push(row.fares[0]);pairs.set(key,pair);
 }
 return {directedPairs:pairs.size,missingReversePairs:[...pairs.values()].filter(p=>!pairs.has(JSON.stringify([p.road,p.destination,p.origin]))).map(({road,origin,destination})=>({road,origin:destination,destination:origin})),invalidOrDuplicatePairs:[...pairs.values()].filter(p=>p.fares.length!==1||!Number.isFinite(p.fares[0])||p.fares[0]<0)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const {rows,fetchedAt}=await fetchTripTariffs();
 if(!rows.length)throw Error('Audit aborted: BPJT unavailable; empty data is not complete coverage.');
 const roads=[...new Set(rows.map(r=>r.road))];
 const report={checkedAt:fetchedAt,scope:'Catalogue and mapping audit; not proof of journey pricing coverage. Missing reverse rows are evidence gaps, not permission to copy fares.',sourceRoads:roads.length,registeredSystems:systems.length,unregisteredRoads:roads.filter(road=>!systems.some(s=>s.rows.includes(road))),systems:systems.map(s=>{const points=[...gates.gates,...publicGates.gates,...operatorGates.gates].filter(g=>g.system===s.id);return {id:s.id,type:s.type,tariffRows:rows.filter(r=>s.rows.includes(r.road)).length,gatePoints:points.length,gatePointsBySource:{pu:gates.gates.filter(g=>g.system===s.id).length,publicPu:publicGates.gates.filter(g=>g.system===s.id).length,operator:operatorGates.gates.filter(g=>g.system===s.id).length},mainlineFeatures:mainlines.roads.filter(r=>r.system===s.id).length,...(s.type==='closed'?auditPairs(rows.filter(r=>s.rows.includes(r.road))):{})};}),unmappedGates:[...gates.unmapped,...publicGates.unmapped]};
 console.log(JSON.stringify(report,null,2));
}
