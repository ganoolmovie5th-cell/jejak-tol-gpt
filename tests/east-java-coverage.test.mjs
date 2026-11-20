import test from 'node:test';import assert from 'node:assert/strict';
import {priceTollSection,matchBoundaryGate,isDupakTollAccess} from '../lib/toll-network.mjs';
import data from '../data/east-java-toll-gates.json' with {type:'json'};
const row=(road,origin,destination,fare)=>({road,origin,destination,fares:[fare]});
const route=(a,b)=>[a,b].map(g=>({latitude:g.lat,longitude:g.lon}));
const section={startPointIndex:0,endPointIndex:1};
test('Surabaya Gresik maps operating gates and exact directed tariffs',()=>{
 const a=data.gates.find(g=>g.tariffName==='Romo Kalisari'),b=data.gates.find(g=>g.tariffName==='Manyar');
 const rows=[row('Surabaya-Gresik','Romo Kalisari','Manyar',15500),row('Surabaya-Gresik','Manyar','Romo Kalisari',15500)];
 assert.equal(priceTollSection(['Surabaya Gresik'],rows,route(a,b),section)[0].fare,15500);
 assert.equal(priceTollSection(['Surabaya Gresik'],rows,route(b,a),section)[0].fare,15500);
});
test('KLBM joins Sumo at its own named Wringinanom tariff boundary',()=>{
 const a=data.gates.find(g=>g.tariffName==='Bunder'),b=data.gates.find(g=>g.tariffName==='Lebani Gresik');
 const rows=[row('Krian–Legundi–Bunder–Manyar (Krian–Legundi–Bunder)','Bunder','SS Wringinanom',42000)];
 const result=priceTollSection(['Krian Legundi Bunder Manyar','Surabaya Mojokerto'],rows,route(a,b),section);
 assert.equal(result[0].fare,42000);assert.equal(result[0].exit,'SS Wringinanom');assert.equal(result[1].entry,'Wringinanom Junction');assert.equal(result[1].fare,null);
 assert.equal(priceTollSection(['Krian Legundi Bunder Manyar'],[],route(a,b),section)[0].fare,null);
});

test('Dupak open access is identified only on mapped Sugres geometry near its endpoint',()=>{
 const p={latitude:-7.24497,longitude:112.71418};
 assert.equal(isDupakTollAccess('Jalan Dupak Rukun',p),true);
 assert.equal(matchBoundaryGate([p,p],0,'surabaya-gresik').tariffName,'Dupak');
 assert.equal(isDupakTollAccess('Jalan Dupak Rukun',{...p,latitude:p.latitude+.002}),false);
 assert.equal(isDupakTollAccess('Jalan Lain',p),false);
 assert.equal(isDupakTollAccess('Jalan Dupak Rukun',{latitude:-7.238689,longitude:112.678086}),false);
});
