import gateData from '../data/toll-gates.json' with {type:'json'};
import mainlines from '../data/toll-mainlines.json' with {type:'json'};
import puData from '../data/pu-toll-network.json' with {type:'json'};
import publicGates from '../data/pu-public-toll-gates.json' with {type:'json'};
import {tariffGateName as tariffName} from './tariff-gate-name.mjs';
import {TARIFF_SOURCE} from './toll-tariffs.mjs';
export const normalizeRoad=s=>String(s||'').toLowerCase().replace(/\b(jalan|jl|tol|toll|road)\b/g,'').replace(/[^a-z0-9]/g,'');
const NETWORK_SOURCE='https://www.jmtransjawatol.co.id/id/layanan/jalan-tol/jaringan-jalan-tol-jtt';
// Explicit aliases, never substring matching: JORR 2 and Cinere–Jagorawi have separate tariffs.
export const systems=[
 {id:'dalam-kota-jakarta',name:'Dalam Kota Jakarta terintegrasi',type:'open',aliases:['Insinyur Wiyoto Wiyono','Ir Wiyoto Wiyono','Wiyoto Wiyono','Cawang Tomang Pluit','Cawang Tanjung Priok Ancol Timur Jembatan Tiga Pluit'],rows:['Cawang-Tomang-Pluit (CTC)','Cawang-Tj. Priok-Ancol Timur-Jembatan Tiga/Pluit'],source:'https://investor.jasamarga.com/misc/AR/html/2024/961/'},
 {id:'tangerang-merak',name:'Tangerang–Merak',type:'closed',aliases:['Tangerang Merak','Merak Tangerang','Exit Tol Balaraja Timur','Exit Tol Balaraja Barat','Exit Tol Cikande','Exit Tol Ciujung','Exit Tol Serang Timur','Exit Tol Serang Barat','Akses Tol Serang Barat','Exit Tol Cilegon Timur','Akses Tol Cilegon Timur','Exit Tol Cilegon Barat','Exit Tol Merak'],rows:['Tangerang-Merak'],source:'https://jdih.pu.go.id/internal/assets/assets/produk/KepmenPUPR/2025/02/2025kmpu176.pdf'},
 {id:'cijago',name:'Cinere–Jagorawi',type:'open',aliases:['Cinere Jagorawi','Jagorawi Cinere','Cijago'],rows:['Cinere-Jagorawi'],source:'https://bpjt.pu.go.id/bayar-tol-sistem-terbuka-optimalisasi-layanan-transaksi-di-jalan-tol/'},
 {id:'jakarta-tangerang',name:'Jakarta–Tangerang',type:'open',aliases:['Jakarta Tangerang','Tangerang Jakarta','Janger'],rows:['Jakarta-Tangerang'],source:'https://bpjt.pu.go.id/bayar-tol-sistem-terbuka-optimalisasi-layanan-transaksi-di-jalan-tol/'},
 {id:'serbaraja',name:'Serpong–Balaraja (Serbaraja)',type:'zoned',aliases:['Serpong Balaraja','Balaraja Serpong','Serbaraja'],rows:['Serpong-Balaraja Seksi 1 (Serpong-SS Legok)'],source:'https://serbaraja.sinarmasland.com/info-layanan/tariff'},
 {id:'sedyatmo',name:'Sedyatmo',type:'open',aliases:['Sedyatmo','Soedijatmo','Prof. Dr. Ir. Sedyatmo','Prof. Dr. Ir. Soedijatmo','Prof Dr Sedyatmo','Prof Dr Ir Soediyatmo'],rows:['Prof.Dr.Ir.Soedijatmo'],source:'https://investor-id.jasamarga.com/newsroom/LK_JSMR_31_Desember_2025.pdf'},
 {id:'cipali',name:'Cikopo–Palimanan (Cipali)',type:'closed',aliases:['Cipali','Cikopo Palimanan','Cikampek Palimanan','Exit Tol Kalijati','Exit Tol Subang','Exit Tol Cikedung','Exit Tol Kertajati','Exit Tol Sumberjaya'],rows:['Cikampek-Palimanan'],source:gateData.source},
 {id:'pejagan-pemalang',name:'Pejagan–Pemalang',type:'closed',aliases:['Pejagan Pemalang','Pemalang Pejagan','Exit Tol Brebes Barat','Exit Tol Brebes Timur'],rows:['Pejagan-Pemalang'],source:gateData.source},
 {id:'jagorawi',name:'Jagorawi',type:'open',aliases:['Jagorawi','Jakarta Bogor Ciawi'],rows:['Jakarta-Bogor-Ciawi'],source:'https://investor.jasamarga.com/misc/AR/html/2024/963/'},
 {id:'desari',name:'Depok–Antasari',type:'open',aliases:['Depok Antasari','Desari'],rows:['Depok-Antasari'],source:'https://bpjt.pu.go.id/cukup-satu-kali-tapping-mulai-hari-ini-bayar-tol-depok-antasari-seksi-andara-sawangan-berlakukan-sistem-terbuka/'},
 {id:'bsd',name:'Pondok Aren–Serpong',type:'open',aliases:['Jakarta Serpong','Pondok Aren Serpong'],rows:['Pondok Aren-Serpong'],source:'https://bsdtol.com/tarif'},
 {id:'jorr',name:'JORR 1 terintegrasi',type:'open',aliases:['Lingkar Luar Jakarta','JORR','JORR W1','JORR W2','JORR W2 Utara','JORR W2 Selatan','JORR S','Akses Tanjung Priok','Pondok Aren Ulujami'],rows:['JORR S','JORR NON S','JORR W1 (Kebon Jeruk-Penjaringan)','JORR W2 Utara (Kebon Jeruk-Ulujami)','Akses Tanjung Priuk','Pondok Aren-Bintaro Viaduct-Ulujami'],source:'https://investor-id.jasamarga.com/newsroom/LK_JSMR_31_Desember_2025.pdf'},
 {id:'semarang-batang',name:'Semarang–Batang',type:'closed',aliases:['Semarang Batang','Batang Semarang','Exit Tol Weleri','Exit Tol Kaliwungu'],rows:['Semarang-Batang'],source:gateData.source}
];
const corridors=[
 ['gempol-pandaan','Gempol–Pandaan','Gempol-Pandaan',['Gempol Pandaan','Pandaan Gempol']],
 ['pandaan-malang','Pandaan–Malang','Pandaan-Malang',['Pandaan Malang','Malang Pandaan','Exit Tol Purwodadi','Exit Tol Lawang','Exit Tol Singosari','Exit Tol Pakis','Exit Tol Malang']],
 ['serpong-cinere','Serpong–Cinere','Serpong-Cinere Seksi 1 dan 2',['Serpong Cinere','Cinere Serpong']],
 ['jakarta-cikampek','Jakarta–Cikampek','Jakarta-Cikampek dan Jakarta -Cikampek II Elevated',['Jakarta Cikampek','Cikampek Jakarta','Jakarta Cikampek II Elevated','MBZ']],
 ['palikanci','Palimanan–Kanci','Palimanan-Kanci',['Palimanan Kanci','Kanci Palimanan','Palikanci','Exit Tol Plumbon','Exit Tol Ciperna']],
 ['kanci-pejagan','Kanci–Pejagan','Kanci-Pejagan',['Kanci Pejagan','Pejagan Kanci','Exit Tol Ciledug']],
 ['pemalang-batang','Pemalang–Batang','Pemalang-Batang',['Pemalang Batang','Batang Pemalang','Exit Tol Pemalang','Exit Tol Pekalongan','Exit Tol Batang']],
 ['semarang-abc','Semarang ABC','Semarang Seksi A,B,C',['Semarang ABC','Semarang Seksi A B C','Jatingaleh Krapyak','Krapyak Jatingaleh','Jatingaleh Srondol','Srondol Jatingaleh','Jatingaleh Kaligawe','Kaligawe Jatingaleh']],
 ['semarang-solo','Semarang–Solo','Semarang-Solo',['Semarang Solo','Solo Semarang','Banyumanik Ungaran','Ungaran Bawen','Bawen Salatiga','Salatiga Boyolali','Boyolali Kartasura','Boyolali Kartosuro']],
 ['solo-ngawi','Solo–Ngawi','Solo-Ngawi',['Solo Ngawi','Ngawi Solo','Solo Mantingan Ngawi']],
 ['ngawi-kertosono','Ngawi–Kertosono','Ngawi-Kertosono',['Ngawi Kertosono','Kertosono Ngawi']],
 ['kertosono-mojokerto','Kertosono–Mojokerto','Kertosono-Mojokerto',['Kertosono Mojokerto','Mojokerto Kertosono','Jombang Mojokerto','Mojokerto Jombang']],
 ['surabaya-mojokerto','Surabaya–Mojokerto','Surabaya-Mojokerto',['Surabaya Mojokerto','Mojokerto Surabaya','Sumo']],
 ['surabaya-gempol','Surabaya–Gempol','Surabaya-Gempol',['Surabaya Gempol','Gempol Surabaya']],
 ['gempol-pasuruan','Gempol–Pasuruan','Gempol-Pasuruan',['Gempol Pasuruan','Pasuruan Gempol']],
 ['pasuruan-probolinggo','Pasuruan–Probolinggo','Pasuruan-Probolinggo Seksi I - IVA',['Pasuruan Probolinggo','Probolinggo Pasuruan']],
];
systems.push(...corridors.map(([id,name,row,aliases])=>({id,name,rows:[row],aliases,type:id==='semarang-abc'?'open':['surabaya-mojokerto','surabaya-gempol'].includes(id)?'mixed':'closed',source:NETWORK_SOURCE})));
// Logical concession boundaries, not extra payment gates. Only adjacent, explicitly named systems may use them.
const connections=[
 ['gempol-pandaan','pandaan-malang','Pandaan','Pandaan'],
 ['jakarta-cikampek','cipali','Cikampek','Cikopo'],
 ['cipali','palikanci','Palimanan','Palimanan'],
 ['palikanci','kanci-pejagan','Kanci','Kanci'],
 ['kanci-pejagan','pejagan-pemalang','Pejagan','Pejagan'],
 ['pejagan-pemalang','pemalang-batang','Pemalang','Pemalang/Sewaka'],
 ['pemalang-batang','semarang-batang','Pasekaran','Batang/Pasekaran'],
 ['semarang-batang','semarang-abc','Semarang/Kalikangkung','Krapyak'],
 ['semarang-abc','semarang-solo','Banyumanik','Banyumanik'],
 ['semarang-solo','solo-ngawi','Kartasura','Kartasura'],
 ['solo-ngawi','ngawi-kertosono','Klitik','Klitik'],
 ['ngawi-kertosono','kertosono-mojokerto','Kertosono','Batas Barat'],
 ['kertosono-mojokerto','surabaya-mojokerto','Mojokerto','Mojokerto'],
 ['gempol-pasuruan','pasuruan-probolinggo','Grati','Grati'],
 ['surabaya-mojokerto','surabaya-gempol','Waru (Terbuka)','Waru'],
 ['serbaraja','bsd','Serpong','Serpong'],
 ['bsd','serpong-cinere','Serpong','Junction Serpong'],
 ['serpong-cinere','desari','Cinere','Krukut']
];
function connectingBoundary(systemId,neighborId,points,section){
 // Cikupa is a physical tariff boundary; require the actual route to cross its plaza.
 if(systemId==='tangerang-merak'&&neighborId==='jakarta-tangerang')return publicGates.gates.find(g=>g.tariffName==='Cikupa'&&gatePassages(points,section.startPointIndex,section.endPointIndex,g)===1)||null;
 const link=connections.find(([a,b])=>(a===systemId&&b===neighborId)||(b===systemId&&a===neighborId));
 if(!link)return null;const name=link[link[0]===systemId?2:3];return {id:`junction:${systemId}:${name}`,name,tariffName:name};
}
export function systemForRoad(name){const key=normalizeRoad(name);return systems.find(s=>s.aliases.some(a=>normalizeRoad(a)===key));}
for(const system of systems.filter(s=>['surabaya-mojokerto','serpong-cinere'].includes(s.id)))system.source='https://investor.jasamarga.com/newsroom/PT_Jasa_Marga_(Persero)_Tbk_30_September_2026_(1).pdf';
const combinedGates=[...gateData.gates,...puData.gates,...publicGates.gates];
function metres(a,b){const lat=(a.latitude+b.latitude)*Math.PI/360;return Math.hypot((a.longitude-b.longitude)*111320*Math.cos(lat),(a.latitude-b.latitude)*111320);}
function distanceToSegment(g,a,b){const latitude=g.lat,scale=Math.cos(latitude*Math.PI/180);const ax=(a.longitude-g.lon)*111320*scale,ay=(a.latitude-g.lat)*111320,bx=(b.longitude-g.lon)*111320*scale,by=(b.latitude-g.lat)*111320;const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return {distance:Math.hypot(ax+t*dx,ay+t*dy),t};}
export function matchBoundaryGate(points,index,systemId,gates=combinedGates){
 if(!points[index])return null;
 // Longer approaches are accepted only when one official access path contains both boundary and plaza.
 const approaches=puData.junctions.filter(j=>j.system===systemId&&/^Akses (ON|OFF) SS /i.test(j.name)).flatMap(j=>j.paths).map(path=>path.map(([longitude,latitude])=>({longitude,latitude})));
 const nearPath=(point,path,tolerance)=>path.some((p,i)=>i>0&&distanceToSegment({lat:point.latitude,lon:point.longitude},path[i-1],p).distance<=tolerance);
 const offsets=[0];for(let i=1;i<points.length;i++)offsets.push(offsets[i-1]+metres(points[i-1],points[i]));
 const matches=[];
 for(const gate of gates.filter(g=>g.system===systemId)){
  let window=2000;
  for(const path of approaches)if(nearPath(points[index],path,30)&&nearPath({latitude:gate.lat,longitude:gate.lon},path,60)){
   const length=path.reduce((sum,p,i)=>sum+(i?metres(path[i-1],p):0),0);
   window=Math.max(window,Math.min(5000,length+200));
  }
  let closest=Infinity;
  for(let i=0;i<points.length-1;i++){
   if(offsets[i+1]<offsets[index]-window||offsets[i]>offsets[index]+window)continue;
   const hit=distanceToSegment(gate,points[i],points[i+1]),along=offsets[i]+hit.t*(offsets[i+1]-offsets[i]);
   if(Math.abs(along-offsets[index])<=window)closest=Math.min(closest,hit.distance);
  }
  if(closest<=60)matches.push(gate);
 }
 const keys=new Set(matches.map(g=>g.tariffName?tariffName(g.tariffName):g.id));
 if(keys.size===1)return matches[0];
 // Prefer an operator point when the PU copy represents the same named tariff boundary.
 const operator=matches.filter(g=>g.id.startsWith('jsb-'));
 if(operator.length===1&&matches.every(g=>g===operator[0]||tariffName(g.tariffName||g.name)===tariffName(operator[0].tariffName||operator[0].name)))return operator[0];
 if(!matches.length&&systemId==='surabaya-mojokerto'&&matchesWaruBoundary(points[index]))return {id:'junction:sumo-waru',name:'SS Waru',tariffName:'Waru (Terbuka)'};
 return null;
}
export function gatePassages(points,start,end,gate){
 let count=0,inside=false;
 for(let i=start;i<end;i++){const hit=distanceToSegment(gate,points[i],points[i+1]).distance<=60;if(hit&&!inside)count++;inside=hit;}
 return count;
}
function matchesWaruBoundary(point){
 // The public mainline ends at Waru; its eastern approach can end before a physical plaza in TomTom sections.
 const end={latitude:-7.346775,longitude:112.726081};if(metres(point,end)>1000)return false;
 return mainlines.roads.filter(r=>r.system==='surabaya-mojokerto').some(r=>r.paths.some(path=>path.some((p,i)=>i>0&&distanceToSegment({lat:point.latitude,lon:point.longitude},{longitude:path[i-1][0],latitude:path[i-1][1]},{longitude:p[0],latitude:p[1]}).distance<=30)));
}
function directedFare(rows,entry,exit){
 const from=tariffName(entry.tariffName||entry.name),to=tariffName(exit.tariffName||exit.name);
 const matches=rows.filter(r=>tariffName(r.origin)===from&&tariffName(r.destination)===to);
 const reverse=rows.filter(r=>tariffName(r.origin)===to&&tariffName(r.destination)===from);
 if(matches.length!==1||!Number.isFinite(matches[0].fares[0])||matches[0].fares[0]<0)return null;
 // A published reverse price may expose a shifted source table; never substitute it for a missing direction.
 if(reverse.length>1||reverse.some(r=>r.fares[0]!==matches[0].fares[0]))return null;
 return matches[0].fares[0];
}
function serbarajaFare(rows,entry,exit){
 // The operator explicitly publishes these two zones in both directions.
 const boundaries=['Serpong','SS CBD','SS Legok'],a=boundaries.indexOf(entry.tariffName||entry.name),b=boundaries.indexOf(exit.tariffName||exit.name);
 if(a<0||b<0||a===b)return null;let total=0;
 for(let i=Math.min(a,b);i<Math.max(a,b);i++){
  const zone=rows.filter(r=>r.origin===boundaries[i]&&r.destination===boundaries[i+1]);
  if(zone.length!==1||!Number.isFinite(zone[0].fares[0])||zone[0].fares[0]<0)return null;total+=zone[0].fares[0];
 }
 return total;
}
function mixedSurgemFare(rows,entry,exit){
 const boundaries=['Dupak','Waru','Sidoarjo','Porong','Kejapanan','Gempol'],from=tariffName(entry.tariffName||entry.name),to=tariffName(exit.tariffName||exit.name),a=boundaries.indexOf(from),b=boundaries.indexOf(to);
 if(a<0||b<0)return null;
 if(a===b&&a!==0)return null;
 let total=0,lo=Math.min(a,b),hi=Math.max(a,b);
 if(lo===0){const zone=rows.filter(r=>r.origin==='Dupak'&&r.destination==='Waru');if(zone.length!==1||!Number.isFinite(zone[0].fares[0])||zone[0].fares[0]<0)return null;total+=zone[0].fares[0];lo=1;}
 if(lo<3&&hi>1){const end=Math.min(hi,3),x={name:boundaries[lo]},y={name:boundaries[end]},fare=a<b?directedFare(rows,x,y):directedFare(rows,y,x);if(fare===null)return null;total+=fare;lo=end;}
 for(let i=lo;i<hi;i++){const zone=rows.filter(r=>r.origin===boundaries[i]&&r.destination===boundaries[i+1]);if(zone.length!==1||!Number.isFinite(zone[0].fares[0])||zone[0].fares[0]<0)return null;total+=zone[0].fares[0];}
 return total;
}
function mixedSumoFare(rows,entry,exit,points,section){
 const from=tariffName(entry.tariffName||entry.name),to=tariffName(exit.tariffName||exit.name),open='Waru (Terbuka)',boundary='WRR/Warugunung';
 const closedRows=rows.filter(r=>r.origin!==open);
 if(from!==open&&to!==open)return directedFare(closedRows,entry,exit);
 const other=from===open?to:from;
 const openRows=rows.filter(r=>r.origin===open&&tariffName(r.destination)===boundary);
 if(openRows.length!==1||!Number.isFinite(openRows[0].fares[0])||openRows[0].fares[0]<0)return null;
 // The open tariff applies only when the route actually crosses the main Warugunung plaza.
 const gate=puData.gates.find(g=>g.system==='surabaya-mojokerto'&&tariffName(g.tariffName)===boundary);
 if(!gate)return null;
 let crossed=false;for(let i=section.startPointIndex;i<section.endPointIndex;i++)if(distanceToSegment(gate,points[i],points[i+1]).distance<=60){crossed=true;break;}
 if(!crossed)return null;
 if(other===boundary)return openRows[0].fares[0];
 const edge={name:boundary},closed=from===open?directedFare(closedRows,edge,exit):directedFare(closedRows,entry,edge);
 return closed===null?null:closed+openRows[0].fares[0];
}
export function priceTollSection(names,tariffs,points,section){
 const groups=[];
 for(const name of names){const system=systemForRoad(name),id=system?.id||`unknown:${name}`;if(groups.at(-1)?.id===id){if(!groups.at(-1).names.includes(name))groups.at(-1).names.push(name);}else groups.push({id,system,names:[name]});}
 if(!groups.length)groups.push({id:'unknown',names:[]});
 return groups.map((group,index)=>{
  const {system}=group;let fare=null,entry=null,exit=null,reason='Ruas belum dipetakan';
  if(system){
   const rows=tariffs.filter(r=>system.rows.includes(r.road));
   if(system.type==='open'){
    const values=rows.map(r=>r.fares[0]);
    if(new Set(rows.map(r=>`${r.road}|${r.origin}|${r.destination}`)).size===rows.length&&values.length&&values.every(v=>Number.isFinite(v)&&v>=0)&&new Set(values).size===1){fare=values[0];reason=null;}else reason='Tarif sumber tidak tersedia atau tidak konsisten';
   }else{
    entry=index===0?matchBoundaryGate(points,section.startPointIndex,system.id):connectingBoundary(system.id,groups[index-1].id,points,section);
    exit=index===groups.length-1?matchBoundaryGate(points,section.endPointIndex,system.id):connectingBoundary(system.id,groups[index+1].id,points,section);
    if(entry&&exit&&(tariffName(entry.tariffName||entry.name)!==tariffName(exit.tariffName||exit.name)||(system.id==='surabaya-gempol'&&entry.id!==exit.id&&entry.tariffName==='Dupak'))){
     fare=system.type==='zoned'?serbarajaFare(rows,entry,exit):system.type==='mixed'?(system.id==='surabaya-mojokerto'?mixedSumoFare(rows,entry,exit,points,section):mixedSurgemFare(rows,entry,exit)):directedFare(rows,entry,exit);reason=fare===null?'Pasangan tarif tidak tersedia atau tidak konsisten':null;
    }else reason=groups.length>1?'Sambungan atau gerbang perjalanan belum teridentifikasi':'Gerbang masuk atau keluar belum teridentifikasi';
   }
  }
  return {systemId:system?.id||null,name:system?.name||group.names.join(' · ')||'Ruas tanpa nama',names:group.names,type:system?.type||'unknown',fare,entry:entry?.name||null,exit:exit?.name||null,reason,geometrySource:entry?.source||exit?.source||puData.source,mainlineSource:'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SARANA_PRASARANA/MapServer/14',boundarySource:entry?.id.startsWith('junction:')||exit?.id.startsWith('junction:')?NETWORK_SOURCE:null,source:TARIFF_SOURCE,ruleSource:system?.source||null};
 });
}
