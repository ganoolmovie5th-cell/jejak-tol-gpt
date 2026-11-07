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
