import {test} from 'node:test';import assert from 'node:assert/strict';
import {priceTollSection,systemForRoad,matchBoundaryGate} from '../lib/toll-network.mjs';
const row=(road,fare,origin='',destination='')=>({road,origin,destination,fares:[fare]});
const price=(names,rows)=>priceTollSection(names,rows,[],{});
test('open systems price independently; adjacent JORR aliases pay once',()=>{
 const result=price(['Jalan Tol Jakarta - Serpong','Jalan Tol Lingkar Luar Jakarta','JORR W1'],[row('Pondok Aren-Serpong',9500),row('JORR S',17000),row('JORR NON S',17000)]);
 assert.deepEqual(result.map(c=>c.fare),[9500,17000]);assert.equal(result.reduce((s,c)=>s+c.fare,0),26500);
 assert.equal(price(['Depok-Antasari'],[row('Depok-Antasari',13500)])[0].fare,13500);
});
test('unknown roads, conflicting tariffs and lookalikes never imply free travel',()=>{
 assert.equal(systemForRoad('JORR 2'),undefined);assert.equal(systemForRoad('Cinere Jagorawi'),undefined);
 assert.equal(price(['Jalan Tol Baru'],[])[0].fare,null);
 assert.equal(price(['JORR'],[row('JORR S',17000),row('JORR NON S',18000)])[0].fare,null);
 assert.equal(price(['Jagorawi'],[])[0].fare,null);
});
test('leaving and returning to a payment system is not globally deduplicated',()=>{
 const r=price(['Jagorawi','Depok Antasari','Jagorawi'],[row('Jakarta-Bogor-Ciawi',7500),row('Depok-Antasari',13500)]);assert.equal(r.length,3);
});
test('gate matching rejects parallel misses and ambiguous gates',()=>{
 const points=[{latitude:-6.97,longitude:110.05},{latitude:-6.97,longitude:110.06}];
 const g={id:'test',name:'Test',system:'s',lat:-6.97,lon:110.055};assert.equal(matchBoundaryGate(points,0,'s',[g]).name,'Test');
 assert.equal(matchBoundaryGate(points,0,'s',[g,{...g,id:'other'}]),null);
 assert.equal(matchBoundaryGate(points,0,'s',[{...g,lat:-6.98}]),null);
});
test('closed fare uses exact directed gate pair from operator coordinates',()=>{
 const points=[{latitude:-6.9737874,longitude:110.0585836},{latitude:-6.98,longitude:110.1},{latitude:-6.9860075,longitude:110.1528794}];
 const rows=[row('Semarang-Batang',21000,'Weleri','Kendal'),row('Semarang-Batang',22000,'Kendal','Weleri')];
 const section={startPointIndex:0,endPointIndex:2};
 assert.equal(priceTollSection(['Jalan Exit Tol Weleri','Jalan Tol Batang Semarang'],rows,points,section)[0].fare,21000);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang'],rows,[...points].reverse(),section)[0].fare,22000);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang'],[],points,section)[0].fare,null);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang','Jalan Tol Baru'],rows,points,section)[0].fare,null);
});
test('sparse polyline does not match a gate far along a long segment',()=>{
 const points=[{latitude:-6.97,longitude:110},{latitude:-6.97,longitude:111}];
 const gate={id:'far',system:'s',name:'Far gate',lat:-6.97,lon:110.5};assert.equal(matchBoundaryGate(points,0,'s',[gate]),null);
});
