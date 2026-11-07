import gateData from '../data/toll-gates.json' with {type:'json'};
import {TARIFF_SOURCE} from './toll-tariffs.mjs';
export const normalizeRoad=s=>String(s||'').toLowerCase().replace(/\b(jalan|jl|tol|toll|road)\b/g,'').replace(/[^a-z0-9]/g,'');
// Explicit aliases, never substring matching: JORR 2 and Cinere–Jagorawi have separate tariffs.
export const systems=[
 {id:'jagorawi',name:'Jagorawi',type:'open',aliases:['Jagorawi','Jakarta Bogor Ciawi'],rows:['Jakarta-Bogor-Ciawi'],source:'https://investor.jasamarga.com/misc/AR/html/2024/963/'},
 {id:'desari',name:'Depok–Antasari',type:'open',aliases:['Depok Antasari','Desari'],rows:['Depok-Antasari'],source:'https://bpjt.pu.go.id/cukup-satu-kali-tapping-mulai-hari-ini-bayar-tol-depok-antasari-seksi-andara-sawangan-berlakukan-sistem-terbuka/'},
 {id:'bsd',name:'Pondok Aren–Serpong',type:'open',aliases:['Jakarta Serpong','Pondok Aren Serpong'],rows:['Pondok Aren-Serpong'],source:'https://bsdtol.com/tarif'},
 {id:'jorr',name:'JORR 1 terintegrasi',type:'open',aliases:['Lingkar Luar Jakarta','JORR','JORR W1','JORR W2','JORR S','Akses Tanjung Priok','Pondok Aren Ulujami'],rows:['JORR S','JORR NON S','JORR W1 (Kebon Jeruk-Penjaringan)','JORR W2 Utara (Kebon Jeruk-Ulujami)','Akses Tanjung Priuk','Pondok Aren-Bintaro Viaduct-Ulujami'],source:'https://investor-id.jasamarga.com/newsroom/LK_JSMR_31_Desember_2025.pdf'},
 {id:'semarang-batang',name:'Semarang–Batang',type:'closed',aliases:['Semarang Batang','Batang Semarang','Exit Tol Weleri','Exit Tol Kaliwungu'],rows:['Semarang-Batang'],source:gateData.source}
];
export function systemForRoad(name){const key=normalizeRoad(name);return systems.find(s=>s.aliases.some(a=>normalizeRoad(a)===key));}
function metres(a,b){const lat=(a.latitude+b.latitude)*Math.PI/360;return Math.hypot((a.longitude-b.longitude)*111320*Math.cos(lat),(a.latitude-b.latitude)*111320);}
function distanceToSegment(g,a,b){const latitude=g.lat,scale=Math.cos(latitude*Math.PI/180);const ax=(a.longitude-g.lon)*111320*scale,ay=(a.latitude-g.lat)*111320,bx=(b.longitude-g.lon)*111320*scale,by=(b.latitude-g.lat)*111320;const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));return {distance:Math.hypot(ax+t*dx,ay+t*dy),t};}
export function matchBoundaryGate(points,index,systemId,gates=gateData.gates){
 if(!points[index])return null;
 // shortcut: reject boundaries farther than 2 km along the route from a verified gate; expand only with reviewed junction data.
 let lo=index,hi=index,d=0;while(lo>0&&d<2000){d+=metres(points[lo],points[lo-1]);lo--;}
 d=0;while(hi<points.length-1&&d<2000){d+=metres(points[hi],points[hi+1]);hi++;}
 const offsets=[0];for(let i=1;i<points.length;i++)offsets.push(offsets[i-1]+metres(points[i-1],points[i]));
 const matches=[];
 for(const gate of gates.filter(g=>g.system===systemId)){
  let closest=Infinity;for(let i=lo;i<hi;i++){const hit=distanceToSegment(gate,points[i],points[i+1]);const along=offsets[i]+hit.t*(offsets[i+1]-offsets[i]);if(Math.abs(along-offsets[index])<=2000)closest=Math.min(closest,hit.distance);}
  if(closest<=60)matches.push(gate);
 }
 return matches.length===1?matches[0]:null;
}
const gateTariffName=name=>name==='Kalikangkung'?'Semarang/Kalikangkung':name;
export function priceTollSection(names,tariffs,points,section){
 const groups=[];
 for(const name of names){const system=systemForRoad(name),id=system?.id||`unknown:${name}`;if(groups.at(-1)?.id===id){if(!groups.at(-1).names.includes(name))groups.at(-1).names.push(name);}else groups.push({id,system,names:[name]});}
 if(!groups.length)groups.push({id:'unknown',names:[]});
 return groups.map(group=>{
  const {system}=group;let fare=null,entry=null,exit=null,reason='Ruas belum dipetakan';
  if(system){
   const rows=tariffs.filter(r=>system.rows.includes(r.road));
   if(system.type==='open'){
    const values=rows.map(r=>r.fares[0]);
    if(new Set(rows.map(r=>`${r.road}|${r.origin}|${r.destination}`)).size===rows.length&&values.length&&values.every(v=>Number.isFinite(v)&&v>=0)&&new Set(values).size===1){fare=values[0];reason=null;}else reason='Tarif sumber tidak tersedia atau tidak konsisten';
   }else if(groups.length===1){
    entry=matchBoundaryGate(points,section.startPointIndex,system.id);exit=matchBoundaryGate(points,section.endPointIndex,system.id);
    if(entry&&exit&&entry.id!==exit.id){const matches=rows.filter(r=>r.origin===gateTariffName(entry.name)&&r.destination===gateTariffName(exit.name));if(matches.length===1&&Number.isFinite(matches[0].fares[0])){fare=matches[0].fares[0];reason=null;}else reason='Pasangan tarif gerbang belum tersedia';}else reason='Gerbang masuk atau keluar belum teridentifikasi';
   }else reason='Sambungan antarsistem tol belum dipetakan';
  }
  return {systemId:system?.id||null,name:system?.name||group.names.join(' · ')||'Ruas tanpa nama',names:group.names,type:system?.type||'unknown',fare,entry:entry?.name||null,exit:exit?.name||null,reason,source:TARIFF_SOURCE,ruleSource:system?.source||null};
 });
}
