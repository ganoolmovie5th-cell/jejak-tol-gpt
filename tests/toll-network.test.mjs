import {test} from 'node:test';import assert from 'node:assert/strict';
import {priceTollSection,systemForRoad,matchBoundaryGate,gatePassages} from '../lib/toll-network.mjs';
const row=(road,fare,origin='',destination='')=>({road,origin,destination,fares:[fare]});
const price=(names,rows)=>priceTollSection(names,rows,[],{});
test('open systems price independently; adjacent JORR aliases pay once',()=>{
 const result=price(['Jalan Tol Jakarta - Serpong','Jalan Tol Lingkar Luar Jakarta','JORR W1'],[row('Pondok Aren-Serpong',9500),row('JORR S',17000),row('JORR NON S',17000)]);
 assert.deepEqual(result.map(c=>c.fare),[9500,17000]);assert.equal(result.reduce((s,c)=>s+c.fare,0),26500);
 assert.equal(price(['Depok-Antasari'],[row('Depok-Antasari',13500)])[0].fare,13500);
});
test('unknown roads, conflicting tariffs and lookalikes never imply free travel',()=>{
 assert.equal(systemForRoad('JORR 2'),undefined);assert.equal(systemForRoad('Cinere Jagorawi').id,'cijago');
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
 const rows=[row('Semarang-Batang',21000,'Weleri','Kendal'),row('Semarang-Batang',21000,'Kendal','Weleri')];
 const section={startPointIndex:0,endPointIndex:2};
 assert.equal(priceTollSection(['Jalan Exit Tol Weleri','Jalan Tol Batang Semarang'],rows,points,section)[0].fare,21000);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang'],rows,[...points].reverse(),section)[0].fare,21000);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang'],[],points,section)[0].fare,null);
 assert.equal(priceTollSection(['Jalan Tol Batang Semarang','Jalan Tol Baru'],rows,points,section)[0].fare,null);
});
test('sparse polyline does not match a gate far along a long segment',()=>{
 const points=[{latitude:-6.97,longitude:110},{latitude:-6.97,longitude:111}];
 const gate={id:'far',system:'s',name:'Far gate',lat:-6.97,lon:110.5};assert.equal(matchBoundaryGate(points,0,'s',[gate]),null);
});
test('new Cipali and Brebes gate pairs use the selected direction only',()=>{
 const examples=[{system:'cipali',road:'Cikampek-Palimanan',entry:'Kalijati',exit:'Subang',points:[[-6.509165149115302,107.67884255609641],[-6.5317716518304145,107.78394280484316]],fare:12500},{system:'pejagan-pemalang',road:'Pejagan-Pemalang',entry:'Brebes Barat',exit:'Brebes Timur'}];
 const c=examples[0],points=c.points.map(([latitude,longitude])=>({latitude,longitude}));
 const result=priceTollSection(['Jalan Tol Cipali'],[row(c.road,c.fare,c.entry,c.exit)],points,{startPointIndex:0,endPointIndex:1});assert.equal(result[0].fare,12500);assert.equal(result[0].entry,'Kalijati');assert.equal(result[0].exit,'Subang');
 assert.equal(priceTollSection(['Jalan Tol Cipali'],[row(c.road,c.fare,c.entry,c.exit)],[...points].reverse(),{startPointIndex:0,endPointIndex:1})[0].fare,null);
 assert.equal(systemForRoad('Exit Tol Brebes Timur').id,'pejagan-pemalang');
 assert.equal(price(['Prof. Dr. Ir. Sedyatmo'],[row('Prof.Dr.Ir.Soedijatmo',8500)])[0].fare,8500);
});

test('cross-system journey uses each concession boundary, not a maximum fare',()=>{
 const names=['Cipali','Palikanci','Kanci Pejagan','Pejagan Pemalang','Pemalang Batang','Batang Semarang'];
 const rows=[row('Cikampek-Palimanan',88500,'Subang','Palimanan'),row('Palimanan-Kanci',13500,'Palimanan','Kanci'),row('Kanci-Pejagan',31500,'Kanci','Pejagan'),row('Pejagan-Pemalang',66000,'Pejagan','Pemalang'),row('Pemalang-Batang',53000,'Pemalang/Sewaka','Pasekaran'),row('Semarang-Batang',76000,'Batang/Pasekaran','Weleri')];
 const points=[{latitude:-6.5317716518304145,longitude:107.78394280484316},{latitude:-6.9737874,longitude:110.0585836}],section={startPointIndex:0,endPointIndex:1};
 const charges=priceTollSection(names,rows,points,section);
 assert.deepEqual(charges.map(c=>c.fare),[88500,13500,31500,66000,53000,76000]);
 assert.equal(charges.reduce((s,c)=>s+c.fare,0),328500);
 assert.ok(charges.every(c=>c.boundarySource));
 const reverseRows=rows.map(r=>({...r,origin:r.destination,destination:r.origin}));
 assert.deepEqual(priceTollSection([...names].reverse(),reverseRows,[...points].reverse(),section).map(c=>c.fare),[76000,53000,66000,31500,13500,88500]);
 // An absent direction is not filled from the opposite journey.
 assert.ok(priceTollSection([...names].reverse(),rows,[...points].reverse(),section).every(c=>c.fare===null));
});

test('east Java through sections use Klitik and Batas Barat, without skipping an unknown connection',()=>{
 const names=['Semarang ABC','Semarang Solo','Solo Ngawi','Ngawi Kertosono','Kertosono Mojokerto','Surabaya Mojokerto'];
 const rows=[row('Semarang Seksi A,B,C',6000),row('Semarang-Solo',92000,'Banyumanik','Kartasura'),row('Solo-Ngawi',163500,'Kartasura','Klitik'),row('Ngawi-Kertosono',102000,'Klitik','Kertosono'),row('Kertosono-Mojokerto',55000,'Batas Barat','Mojokerto')];
 const charges=price(names,rows);assert.deepEqual(charges.map(c=>c.fare),[6000,92000,163500,102000,55000,null]);
 assert.equal(charges[4].entry,'Batas Barat');
 assert.equal(price(['Cipali','Ngawi Kertosono','Kertosono Mojokerto'],rows)[1].fare,null);
 assert.equal(price(['Solo Ngawi','Unknown connector','Ngawi Kertosono','Kertosono Mojokerto'],rows)[2].fare,null);
 assert.equal(price(['Solo Ngawi','Ngawi Kertosono','Solo Ngawi'],rows)[1].fare,null);
});

test('source disagreements, duplicate pairs and negative fares do not produce totals',()=>{
 const names=['Semarang ABC','Semarang Solo','Solo Ngawi'];
 const direct=row('Semarang-Solo',92000,'Banyumanik','Kartasura');
 for(const rows of [[direct,{...direct,origin:'Kartasura',destination:'Banyumanik',fares:[93000]}],[direct,direct],[{...direct,fares:[-1]}]])assert.equal(price(names,rows)[1].fare,null);
 assert.equal(price(['Serpong Balaraja'],[row('Serpong-Balaraja Seksi 1 (Serpong-SS Legok)',6000,'Serpong','SS CBD'),row('Serpong-Balaraja Seksi 1 (Serpong-SS Legok)',7000,'SS CBD','SS Legok')])[0].fare,null);
});

test('Kalikangkung source spelling is normalized for both travel directions',()=>{
 const points=[{latitude:-6.9877007,longitude:110.3169608},{latitude:-6.9737874,longitude:110.0585836}];
 const rows=[row('Semarang-Batang',68500,'Semarang/Kali Kangkung','Weleri'),row('Semarang-Batang',68500,'Weleri','Semarang/Kalikangkung')];
 assert.equal(priceTollSection(['Batang Semarang'],rows,points,{startPointIndex:0,endPointIndex:1})[0].fare,68500);
});

test('Jakarta Tangerang open tariff follows source, rejects missing or conflicting data',()=>{
 const rows=[row('Jakarta-Tangerang',8500,'SS Tomang','Cikupa')];
 assert.equal(price(['Jakarta Tangerang','Tangerang Jakarta'],rows)[0].fare,8500);
 assert.equal(price(['Janger'],[])[0].fare,null);
 assert.equal(price(['Janger'],[...rows,row('Jakarta-Tangerang',9000,'Other','Other')])[0].fare,null);
 assert.notEqual(systemForRoad('Tangerang Merak').id,'jakarta-tangerang');
});

test('Cijago and Jagorawi are distinct open charges, never substring aliases',()=>{
 const rows=[row('Cinere-Jagorawi',15000),row('Jakarta-Bogor-Ciawi',7500)];
 assert.deepEqual(price(['Cijago','Jagorawi'],rows).map(c=>c.fare),[15000,7500]);
 assert.equal(price(['Cijago'],[])[0].fare,null);
 assert.equal(price(['Cijago'],[...rows,row('Cinere-Jagorawi',16000,'Other')])[0].fare,null);
});

test('Pandaan Malang prices verified physical gate pairs in both directions',async()=>{
 const {default:data}=await import('../data/pu-toll-network.json',{with:{type:'json'}});
 const gates=['Purwodadi','Malang'].map(name=>data.gates.find(g=>g.system==='pandaan-malang'&&g.tariffName===name));
 assert(gates.every(Boolean));const points=gates.map(g=>({latitude:g.lat,longitude:g.lon})),section={startPointIndex:0,endPointIndex:1};
 const rows=[row('Pandaan-Malang',23000,'Purwodadi','Malang'),row('Pandaan-Malang',23000,'Malang','Purwodadi')];
 for(const path of [points,[...points].reverse()])assert.equal(priceTollSection(['Pandaan Malang'],rows,path,section)[0].fare,23000);
 assert.equal(priceTollSection(['Pandaan Malang'],[],points,section)[0].fare,null);
 assert.equal(systemForRoad('Gempol Pandaan').id,'gempol-pandaan');
});

test('Pandaan connection prices the shared boundary in both directions without skipping unknown roads',async()=>{
 const {default:data}=await import('../data/pu-toll-network.json',{with:{type:'json'}});
 const gate=data.gates.find(g=>g.system==='pandaan-malang'&&g.tariffName==='Malang');
 const points=[{latitude:-7.7,longitude:112.7},{latitude:gate.lat,longitude:gate.lon}],section={startPointIndex:0,endPointIndex:1};
 const rows=[row('Pandaan-Malang',38000,'Pandaan','Malang'),row('Pandaan-Malang',38000,'Malang','Pandaan')];
 assert.equal(priceTollSection(['Gempol Pandaan','Pandaan Malang'],rows,points,section)[1].fare,38000);
 assert.equal(priceTollSection(['Malang Pandaan','Pandaan Gempol'],rows,[...points].reverse(),section)[0].fare,38000);
 assert.equal(priceTollSection(['Gempol Pandaan','Unknown connector','Pandaan Malang'],rows,points,section)[2].fare,null);
 assert.equal(priceTollSection(['Gempol Pandaan','Pandaan Malang'],[],points,section)[1].fare,null);
});

test('Pandaan Malang exit guidance resolves only explicit road aliases',()=>{
 for(const name of ['Purwodadi','Lawang','Singosari','Pakis','Malang'])assert.equal(systemForRoad('Jalan Exit Tol '+name).id,'pandaan-malang');
 assert.equal(systemForRoad('Jalan Raya Purwodadi'),undefined);
});

test('Tangerang Merak is a closed system and cannot price without verified gates',()=>{
 assert.equal(systemForRoad('Jalan Tol Tangerang - Merak').id,'tangerang-merak');
 assert.equal(systemForRoad('Jalan Exit Tol Serang Timur').id,'tangerang-merak');
 assert.equal(systemForRoad('Jalan Akses Tol Cilegon Timur').id,'tangerang-merak');
 assert.equal(systemForRoad('Jalan Raya Cilegon Timur'),undefined);
 assert.equal(price(['Tangerang Merak'],[row('Tangerang-Merak',58000,'Cikupa','Merak')])[0].fare,null);
 assert.equal(systemForRoad('Tangerang Merak Baru'),undefined);
});

test('Singosari long access uses official approach geometry without widening plaza tolerance',async()=>{
 const {default:data}=await import('../data/pu-toll-network.json',{with:{type:'json'}});
 const gate=data.gates.find(g=>g.system==='pandaan-malang'&&g.tariffName==='Singosari');
 const path=data.junctions.find(j=>j.id==='pu-914').paths[0].map(([longitude,latitude])=>({longitude,latitude}));
 assert.equal(matchBoundaryGate(path,0,'pandaan-malang',[gate])?.tariffName,'Singosari');
 assert.equal(matchBoundaryGate(path,path.length-1,'pandaan-malang',[gate])?.tariffName,'Singosari');
 const reversed=[...path].reverse();assert.equal(matchBoundaryGate(reversed,0,'pandaan-malang',[gate])?.tariffName,'Singosari');
 assert.equal(matchBoundaryGate(path,0,'pandaan-malang',[{...gate,lat:gate.lat+.002}]),null);
});

test('repeated plaza crossings remain separate payment journeys',()=>{
 const gate={lat:-7,lon:110},points=[109.998,110.002,110.004,110.002,109.998].map(longitude=>({longitude,latitude:-7}));
 assert.equal(gatePassages(points,0,points.length-1,gate),2);
});

test('public PU Tangerang Merak gates price directed pairs and keep unknown fares unknown',async()=>{
 const {default:data}=await import('../data/pu-public-toll-gates.json',{with:{type:'json'}});
 const from=data.gates.find(g=>g.tariffName==='Cikupa'),to=data.gates.find(g=>g.tariffName==='Merak');
 const points=[from,to].map(g=>({latitude:g.lat,longitude:g.lon})),section={startPointIndex:0,endPointIndex:1};
 const rows=[row('Tangerang-Merak',58000,'Cikupa','Merak'),row('Tangerang-Merak',58000,'Merak','Cikupa')];
 assert.equal(priceTollSection(['Tangerang Merak'],rows,points,section)[0].fare,58000);
 assert.equal(priceTollSection(['Tangerang Merak'],rows,[...points].reverse(),section)[0].fare,58000);
 assert.equal(priceTollSection(['Tangerang Merak'],[],points,section)[0].fare,null);
 assert.equal(priceTollSection(['Tangerang Merak'],[...rows,row('Tangerang-Merak',59000,'Cikupa','Merak')],points,section)[0].fare,null);
 assert.equal(data.gates.length,15);assert.equal(new Set(data.gates.map(g=>g.tariffName)).size,10);
});

test('Jakarta Tangerang connection requires physically crossing Cikupa and charges both systems',async()=>{
 const {default:data}=await import('../data/pu-public-toll-gates.json',{with:{type:'json'}});
 const a=data.gates.find(g=>g.tariffName==='Cikupa'),b=data.gates.find(g=>g.tariffName==='Merak');
 const points=[a,b].map(g=>({latitude:g.lat,longitude:g.lon})),section={startPointIndex:0,endPointIndex:1};
 const rows=[row('Jakarta-Tangerang',8500,'SS Tomang','Cikupa'),row('Tangerang-Merak',58000,'Cikupa','Merak'),row('Tangerang-Merak',58000,'Merak','Cikupa')];
 assert.deepEqual(priceTollSection(['Jakarta Tangerang','Tangerang Merak'],rows,points,section).map(c=>c.fare),[8500,58000]);
 assert.deepEqual(priceTollSection(['Tangerang Merak','Jakarta Tangerang'],rows,[...points].reverse(),section).map(c=>c.fare),[58000,8500]);
 assert.equal(priceTollSection(['Jakarta Tangerang','Tangerang Merak'],rows,points.map(p=>({...p,latitude:p.latitude+.01})),section)[1].fare,null);
});
