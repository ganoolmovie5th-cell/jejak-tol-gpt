import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './fixtures/gambir-cirebon-mbz.json' with {type:'json'};
import {tripSummary} from '../lib/trip-route.mjs';
import {priceTollSection} from '../lib/toll-network.mjs';
const row=(road,origin,destination,fare)=>({road,origin,destination,fares:[fare]});
const tariffs=[row('Cawang-Tomang-Pluit (CTC)','','',11000),row('Jakarta-Cikampek dan Jakarta -Cikampek II Elevated','Jakarta IC','Karawang Timur',27000),row('Cikampek-Palimanan','Cikopo','Palimanan',132000),row('Palimanan-Kanci','Palimanan','Plumbon',3000)];
const charges=r=>tripSummary(r,tariffs).tolls.flatMap(t=>t.charges);
test('recorded MBZ motorway gap restores Japek and Cipali without charging MBZ twice',()=>{
 const result=tripSummary(fixture,tariffs);assert.equal(result.total,173000);
 assert.deepEqual(result.tolls.flatMap(t=>t.charges.map(c=>c.systemId)),['dalam-kota-jakarta','jakarta-cikampek','cipali','palikanci']);
 assert.equal(result.tolls[0].charges[1].exit,'Cikampek');
});
test('missing or interrupted motorway coverage cannot bridge a gap',()=>{
 for(const mode of ['missing','short']){const r=structuredClone(fixture);r.sections=mode==='missing'?r.sections.filter(s=>s.sectionType!=='MOTORWAY'):r.sections.map(s=>s.sectionType==='MOTORWAY'?{...s,endPointIndex:500}:s);assert.equal(charges(r).find(c=>c.systemId==='cipali').entry,null);}
});
test('unknown named roads and unnamed exits prevent bridging',()=>{
 for(const street of ['Jalan Lokal',undefined]){const r=structuredClone(fixture);r.guidance.instructions.push({pointIndex:700,maneuver:'TAKE_EXIT',street});assert.equal(charges(r).find(c=>c.systemId==='cipali').entry,null);}
});
test('invalid toll boundary is rejected before merging motorway evidence',()=>{
 const r=structuredClone(fixture);r.sections[0].endPointIndex=-1;assert.throws(()=>tripSummary(r,tariffs),/Invalid toll section/);
});
test('Japek zone uses live source price and rejects absent or contradictory rows',()=>{
 const updated=structuredClone(tariffs);updated[1].fares[0]=28000;assert.equal(tripSummary(fixture,updated).total,174000);
 assert.equal(tripSummary(fixture,tariffs.filter((_,i)=>i!==1)).total,null);
 const conflict=[...tariffs,row(tariffs[1].road,'Jakarta IC','Cikampek',29000)];assert.equal(tripSummary(fixture,conflict).total,null);
});
test('zone mapping does not invent the reverse fare',()=>{
 const c=priceTollSection(['Cipali','Jakarta Cikampek','Wiyoto Wiyono'],tariffs,fixture.legs[0].points,{startPointIndex:297,endPointIndex:2361}).find(c=>c.systemId==='jakarta-cikampek');assert.equal(c.entry,'Cikampek');assert.equal(c.exit,'Jakarta IC');assert.equal(c.fare,null);
});
