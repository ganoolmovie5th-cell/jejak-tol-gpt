import {test} from 'node:test';import assert from 'node:assert/strict';
import {readPuFeatures} from '../lib/pu-toll-data.mjs';
import {junctionEvents} from '../lib/pu-route-geometry.mjs';
import {matchBoundaryGate,priceTollSection} from '../lib/toll-network.mjs';
import data from '../data/pu-toll-network.json' with {type:'json'};
const feature=(id,status='Operasi')=>({id,properties:{status},geometry:{type:'Point',coordinates:[110,-7]}});
const collection=features=>({type:'FeatureCollection',features});
test('PU import validates CRS, coordinates, IDs and excludes planned facilities',()=>{
 assert.equal(readPuFeatures(collection([feature(1),feature(2,'Konstruksi'),feature(3,'Rencana')]),'Point').length,1);
 assert.throws(()=>readPuFeatures({...collection([feature(1)]),crs:{properties:{name:'EPSG:3857'}}},'Point'));
 assert.throws(()=>readPuFeatures(collection([feature(1),feature(1)]),'Point'));
 assert.throws(()=>readPuFeatures(collection([{...feature(1),geometry:{type:'Point',coordinates:[-7,110]}}]),'Point'));
 for(const type of ['LineString','MultiLineString']){const coords=[[110,-7],[110.001,-7]];assert.equal(readPuFeatures(collection([{id:1,properties:{status:'Operasi'},geometry:{type,coordinates:type==='LineString'?coords:[coords]}}]),'MultiLineString').length,1);}
});
test('ramp evidence requires distance, alignment and sustained overlap, not a crossing',()=>{
 const junctions=[{system:'test',paths:[[[110,-7],[110.01,-7]]]}],section={startPointIndex:0,endPointIndex:3};
 const points=[0,1,2,3].map(i=>({longitude:110+i*0.001,latitude:-7}));
 assert.equal(junctionEvents(points,section,junctions)[0].system,'test');
 assert.deepEqual(junctionEvents(points.map(p=>({...p,latitude:-7.001})),section,junctions),[]);
 const crossing=[-0.001,-0.0001,0.0001,0.001].map(d=>({longitude:110.005,latitude:-7+d}));assert.deepEqual(junctionEvents(crossing,section,junctions),[]);
 assert.deepEqual(junctionEvents(points.slice(0,1),{startPointIndex:0,endPointIndex:0},junctions),[]);
});
test('PU same-tariff lanes are one logical gate; different tariffs remain ambiguous',()=>{
 const gates=[{id:'pu-a',system:'s',name:'GT A 1',tariffName:'A',lat:-7,lon:110},{id:'pu-b',system:'s',name:'GT A 2',tariffName:'A',lat:-7,lon:110.0001}];
 const points=[{latitude:-7,longitude:109.999},{latitude:-7,longitude:110.001}];
 assert.ok(matchBoundaryGate(points,0,'s',gates));assert.equal(matchBoundaryGate(points,0,'s',[gates[0],{...gates[1],tariffName:'B'}]),null);
});
test('new eastern gate pairs price exact directed rows',()=>{
 const gates=['IC Madiun','IC Caruban'].map(n=>data.gates.find(g=>g.system==='ngawi-kertosono'&&g.tariffName===n));assert.ok(gates.every(Boolean));
 const points=gates.map(g=>({latitude:g.lat,longitude:g.lon}));
 const rows=[{road:'Ngawi-Kertosono',origin:'IC Madiun',destination:'IC Caruban',fares:[10000]}];
 assert.equal(priceTollSection(['Ngawi Kertosono'],rows,points,{startPointIndex:0,endPointIndex:1})[0].fare,10000);
 assert.equal(data.gates.filter(g=>g.system==='serbaraja').length,4);
 assert.equal(data.files[0].features,658);assert.equal(data.files[1].features,1338);
});
test('overlapping carriageways emit one traversal and preserve an actual return',()=>{
 const features=[{system:'a',paths:[[[110,-7],[110.003,-7]]]},{system:'a',paths:[[[110,-7.00001],[110.003,-7.00001]]]},{system:'b',paths:[[[110.003,-7],[110.006,-7]]]}];
 const points=Array.from({length:61},(_,i)=>({longitude:110+i*0.0001,latitude:-7}));
 assert.deepEqual(junctionEvents(points,{startPointIndex:0,endPointIndex:60},features).map(e=>e.system),['a','b']);
 const returnTrip=[...points,...points.slice(0,-1).reverse()];
 assert.deepEqual(junctionEvents(returnTrip,{startPointIndex:0,endPointIndex:returnTrip.length-1},features).map(e=>e.system),['a','b','a']);
});
