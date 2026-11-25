import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {tripSummary} from '../lib/trip-route.mjs';
import {genericEntranceSystem} from '../lib/pu-route-geometry.mjs';
import {parseCtpTariffs} from '../lib/ctp-tariffs.mjs';
const route=JSON.parse(fs.readFileSync(new URL('./fixtures/srijaya-pik.json',import.meta.url),'utf8'));
const rows=[...parseCtpTariffs(fs.readFileSync(new URL('./fixtures/ctp-tariffs.html',import.meta.url),'utf8')),...[['JORR S',17000],['Cawang-Tomang-Pluit (CTC)',11000],['Prof.Dr.Ir.Soedijatmo',8500]].map(([road,fare])=>({road,origin:'',destination:'',fares:[fare]}))];
test('recorded Srijaya–PIK route resolves named ramps and does not add JORR on the final local exit',()=>{
 const result=tripSummary(route,rows);
 assert.equal(result.total,90500);
 assert.deepEqual(result.tolls.map(t=>t.charges.map(c=>c.systemId)),[['cibitung-cilincing','jorr','dalam-kota-jakarta'],['dalam-kota-jakarta','sedyatmo']]);
 assert.match(result.tolls[0].charges[0].note,/dipungut di Marunda/);
 assert.ok(result.tolls[1].exitRoads.includes('Jalan Pantai Indah Kapuk'));
});
test('generic ramps need named entrance evidence and an actual mapped entrance corridor',()=>{
 const bad=structuredClone(route);bad.guidance.instructions=bad.guidance.instructions.filter(i=>!(i.street==='Jalan Tol Lingkar Luar'&&i.maneuver==='ENTER_MOTORWAY'));
 assert.equal(tripSummary(bad,rows).total,null);
 const points=route.legs[0].points;
 assert.equal(genericEntranceSystem('Jalan Tol Lingkar Luar',points,313,undefined,282),'jorr');
 assert.equal(genericEntranceSystem('Jalan Tol Lingkar Luar',points,313,undefined,0),null);
 assert.equal(genericEntranceSystem('Jalan Tol Lingkar Luar',points.map(p=>({...p,latitude:p.latitude+.02})),313,undefined,282),null);
 assert.equal(genericEntranceSystem('Jalan Tol Lingkar Luar',points,-1),null);
});
