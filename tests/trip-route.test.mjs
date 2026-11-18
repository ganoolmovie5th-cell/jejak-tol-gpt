import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tripSummary,validPosition} from '../lib/trip-route.mjs';
import handler from '../api/trip.js';
const route={summary:{lengthInMeters:2000,travelTimeInSeconds:100},legs:[{points:[{latitude:-6,longitude:106},{latitude:-6.1,longitude:106.1},{latitude:-6.2,longitude:106.2}]}],guidance:{instructions:[{pointIndex:0,street:'Jalan Tol Jagorawi'}]},sections:[{sectionType:'TOLL_ROAD',startPointIndex:0,endPointIndex:2}]};
const tariffs=[{road:'Jakarta-Bogor-Ciawi',fares:[7500,12000,17000]}];
test('prices verified Jagorawi section and does not turn unknowns into zero',()=>{assert.equal(tripSummary(route,tariffs).total,7500);assert.equal(tripSummary(route,[]).total,null);const mixed=structuredClone(route);mixed.guidance.instructions.push({pointIndex:1,street:'Jalan Tol Cijago'});assert.equal(tripSummary(mixed,tariffs).total,null);assert.equal(tripSummary({...route,sections:[]},tariffs).total,0);});
test('rejects ambiguous fares and malformed upstream routes',()=>{assert.equal(tripSummary(route,[...tariffs,...tariffs]).total,null);assert.throws(()=>tripSummary({}));assert.throws(()=>tripSummary({...route,sections:[{sectionType:'TOLL_ROAD',startPointIndex:0,endPointIndex:99}]}));});
test('position validation requires numeric Indonesian coordinates',()=>{assert.ok(validPosition({lat:-6.3,lon:106.7}));for(const p of [null,{lat:'-6',lon:106},{lat:NaN,lon:106},{lat:51,lon:0}])assert.ok(!validPosition(p));});
async function call(body,headers={},method='POST'){const res={headers:{},setHeader(k,v){this.headers[k]=v},end(s){this.body=JSON.parse(s)}};await handler({method,headers:{'content-type':'application/json',...headers},body},res);return res;}
test('endpoint validates requests before contacting upstream',async()=>{assert.equal((await call({action:'route',origin:{lat:0,lon:0}})).statusCode,400);assert.equal((await call({action:'places',query:'Jakarta'},{'sec-fetch-site':'cross-site'})).statusCode,403);assert.equal((await call({}, {},'GET')).statusCode,405);assert.equal((await call('x'.repeat(3000))).statusCode,400);});
test('key stays server-side and upstream failures redact details',async()=>{const oldFetch=global.fetch,oldKey=process.env.tomtom_api_key;process.env.tomtom_api_key='secret-test-key';try{global.fetch=async url=>{assert.equal(url.searchParams.get('key'),'secret-test-key');return {ok:false,status:403}};const r=await call({action:'places',query:'Jakarta'});assert.equal(r.statusCode,502);assert.ok(!JSON.stringify(r).includes('secret-test-key'));}finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.tomtom_api_key;else process.env.tomtom_api_key=oldKey;}});

test('exit guidance names the destination road, not another toll road',()=>{
 const exiting=structuredClone(route);exiting.guidance.instructions.push({pointIndex:1,maneuver:'MOTORWAY_EXIT_RIGHT',street:'Jalan Raya Pajajaran'});
 const result=tripSummary(exiting,tariffs);assert.equal(result.total,7500);assert.deepEqual(result.tolls[0].names,['Jalan Tol Jagorawi']);assert.deepEqual(result.tolls[0].exitRoads,['Jalan Raya Pajajaran']);
 exiting.guidance.instructions[1].street='Jalan Tol Cijago';assert.equal(tripSummary(exiting,tariffs).total,null);
 exiting.guidance.instructions[1]={pointIndex:1,maneuver:'STRAIGHT',street:'Unknown highway'};assert.equal(tripSummary(exiting,tariffs).total,null);
});

test('real Cibubur to Botani guidance keeps Pajajaran outside the Jagorawi fare',()=>{
 const sample=structuredClone(route);sample.legs[0].points=Array.from({length:450},()=>({latitude:-6.4,longitude:106.8}));sample.sections[0]={sectionType:'TOLL_ROAD',startPointIndex:100,endPointIndex:445};
 sample.guidance.instructions=[{street:'Jalan Tol Jagorawi',maneuver:'BEAR_RIGHT',pointIndex:103},{street:'Jalan Tol Jagorawi',maneuver:'ENTER_MOTORWAY',pointIndex:117},{street:'Jalan Tol Jagorawi',maneuver:'STRAIGHT',pointIndex:130},{street:'Jalan Tol Jagorawi',maneuver:'FOLLOW',pointIndex:135},{street:'Jalan Tol Jagorawi',maneuver:'TAKE_EXIT',pointIndex:366},{street:'Jalan Tol Jagorawi',maneuver:'KEEP_RIGHT',pointIndex:422},{street:'Jalan Tol Jagorawi',maneuver:'KEEP_RIGHT',pointIndex:439},{street:'Jalan Raya Pajajaran',maneuver:'TURN_RIGHT',pointIndex:441}];
 assert.equal(tripSummary(sample,tariffs).total,7500);assert.deepEqual(tripSummary(sample,tariffs).tolls[0].exitRoads,['Jalan Raya Pajajaran']);
 sample.guidance.instructions.push({street:'Unknown motorway',maneuver:'ENTER_MOTORWAY',pointIndex:443});assert.equal(tripSummary(sample,tariffs).total,null);
});

test('rejects reversed toll bounds and malformed route coordinates',()=>{
 const bad=structuredClone(route);bad.sections[0].startPointIndex=2;bad.sections[0].endPointIndex=0;assert.throws(()=>tripSummary(bad,tariffs));
 for(const coordinate of [NaN,Infinity,'-6',90]){const invalid=structuredClone(route);invalid.legs[0].points[0].latitude=coordinate;assert.throws(()=>tripSummary(invalid,tariffs));}
});

test('empty or missing route geometry never produces a zero toll estimate',()=>{
 for(const legs of [[],[{}],[null],[{points:[]}],[{points:[{latitude:-6,longitude:106}]}]])assert.throws(()=>tripSummary({...route,legs,sections:[]},tariffs),/Invalid route geometry/);
});

test('verified Purwodadi ramp fragments join into one charge; public-road gaps do not',async()=>{
 const {default:data}=await import('../data/pu-toll-network.json',{with:{type:'json'}});
 const path=id=>data.junctions.find(j=>j.id===id).paths[0].map(([longitude,latitude])=>({longitude,latitude}));
 const points=[...path('pu-922'),...path('pu-897').slice(1),...path('pu-914')];
 const sample={summary:{lengthInMeters:25000,travelTimeInSeconds:1800},legs:[{points}],guidance:{instructions:[{pointIndex:0,street:'Jalan Tol Pandaan Malang'},{pointIndex:28,street:'Jalan Tol Pandaan Malang'}]},sections:[{sectionType:'TOLL_ROAD',startPointIndex:0,endPointIndex:23},{sectionType:'TOLL_ROAD',startPointIndex:28,endPointIndex:points.length-1}]};
 const prices=[{road:'Pandaan-Malang',origin:'Purwodadi',destination:'Singosari',fares:[15000]},{road:'Pandaan-Malang',origin:'Singosari',destination:'Purwodadi',fares:[15000]}];
 const result=tripSummary(sample,prices);assert.equal(result.total,15000);assert.equal(result.tolls.length,1);
 const detour=structuredClone(sample);detour.legs[0].points[25].longitude+=.003;assert.equal(tripSummary(detour,prices).total,null);
 const reverse=structuredClone(sample),last=points.length-1;reverse.legs[0].points.reverse();reverse.sections=sample.sections.map(s=>({...s,startPointIndex:last-s.endPointIndex,endPointIndex:last-s.startPointIndex})).reverse();reverse.guidance.instructions=reverse.sections.map(s=>({pointIndex:s.startPointIndex,street:'Jalan Tol Pandaan Malang'}));assert.equal(tripSummary(reverse,prices).total,15000);
});


test('unnamed exit and entry maneuvers still update road classification',()=>{
 const sample=structuredClone(route);
 sample.guidance.instructions.push({pointIndex:1,maneuver:'TAKE_EXIT'},{pointIndex:1,street:'Jalan lokal'});
 assert.equal(tripSummary(sample,tariffs).total,7500);
 sample.guidance.instructions.splice(2,0,{pointIndex:1,maneuver:'ENTER_MOTORWAY'});
 assert.equal(tripSummary(sample,tariffs).total,null);
});

test('split exit sections do not claim an unverified second open-system payment',()=>{
 const sample=structuredClone(route);
 sample.legs[0].points=Array.from({length:8},()=>({latitude:-6,longitude:106}));
 sample.sections=[{sectionType:'TOLL_ROAD',startPointIndex:0,endPointIndex:3},{sectionType:'TOLL_ROAD',startPointIndex:5,endPointIndex:7}];
 sample.guidance.instructions=[{pointIndex:0,street:'Jalan Tol Jagorawi'},{pointIndex:2,maneuver:'TAKE_EXIT'},{pointIndex:5,street:'Jalan Tol Jagorawi'}];
 const result=tripSummary(sample,tariffs);
 assert.equal(result.total,null);assert.equal(result.knownSubtotal,7500);assert.match(result.tolls[1].charges[0].reason,/Pembayaran ulang/);
 for(const maneuver of ['ENTER_MOTORWAY','ENTRANCE_RAMP']){
  const reentry=structuredClone(sample);reentry.guidance.instructions[2].maneuver=maneuver;
  assert.equal(tripSummary(reentry,tariffs).total,15000);
 }
});
