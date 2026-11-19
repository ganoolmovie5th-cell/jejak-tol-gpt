import {junctionEvents,continuousTollGap,isKarawaciExitRoad} from './pu-route-geometry.mjs';
import {priceTollSection,systems,systemForRoad,matchBoundaryGate,gatePassages} from './toll-network.mjs';
const normalized=s=>String(s||'').toLowerCase().replace(/\b(jalan|jl|tol|toll|road)\b/g,'').replace(/[^a-z0-9]/g,'');
export function validPosition(p){return p&&typeof p.lat==='number'&&typeof p.lon==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=-11.5&&p.lat<=6.5&&p.lon>=94&&p.lon<=142;}
export function tripSummary(route,tariffs=[]){
 if(!Number.isFinite(route?.summary?.lengthInMeters)||route.summary.lengthInMeters<0||!Number.isFinite(route?.summary?.travelTimeInSeconds)||route.summary.travelTimeInSeconds<0||!Array.isArray(route.legs)||!Array.isArray(route.guidance?.instructions))throw Error('Invalid route');
 if(!route.legs.length||route.legs.some(l=>!Array.isArray(l?.points)||l.points.length<2))throw Error('Invalid route geometry');
 const points=route.legs.flatMap(l=>l.points),instructions=route.guidance.instructions;
 if(points.some(p=>!p||!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||!validPosition({lat:p.latitude,lon:p.longitude})))throw Error('Invalid route coordinates');
 const sections=(route.sections||[]).filter(s=>s.sectionType==='TOLL_ROAD');
 const tolls=sections.map(section=>{
  if(!Number.isInteger(section.startPointIndex)||!Number.isInteger(section.endPointIndex)||section.startPointIndex>section.endPointIndex||!points[section.startPointIndex]||!points[section.endPointIndex])throw Error('Invalid toll section');
  const names=[],exitRoads=[],roadEvents=[];
  const relevant=instructions.filter(i=>i.pointIndex>=section.startPointIndex&&i.pointIndex<section.endPointIndex);
  let exiting=false;
  for(const i of relevant){
   // Guidance names the road AFTER the maneuver, even when its point is still on a tolled exit ramp.
   if(['TAKE_EXIT','MOTORWAY_EXIT_LEFT','MOTORWAY_EXIT_RIGHT'].includes(i.maneuver))exiting=true;
   if(['ENTER_MOTORWAY','ENTER_FREEWAY','ENTER_HIGHWAY','ENTRANCE_RAMP'].includes(i.maneuver))exiting=false;
   const name=String(i.street||'').trim();if(!name)continue;
   const tollName=/\b(tol|toll)\b/i.test(name)||['jagorawi','jakartabogorciawi'].includes(normalized(name));
   const mappedLocalExit=i===relevant.at(-1)&&names.some(n=>systemForRoad(n)?.id==='jakarta-tangerang')&&isKarawaciExitRoad(name,points[i.pointIndex])&&!['ENTER_MOTORWAY','ENTER_FREEWAY','ENTER_HIGHWAY','ENTRANCE_RAMP'].includes(i.maneuver);
   const target=(exiting&&!tollName)||mappedLocalExit?exitRoads:names;
   if(target.at(-1)!==name)target.push(name);
   if(target===names)roadEvents.push({pointIndex:i.pointIndex,name});
  }
  const geometry=junctionEvents(points,section).map(event=>({...event,name:systems.find(s=>s.id===event.system)?.aliases[0]})).filter(e=>e.name);
  // Geometry records repeated traversals; turn guidance may retain an earlier road name across a concession boundary.
  const mappedSystems=new Set(geometry.map(e=>e.system));
  const pricingNames=[...roadEvents.filter(e=>!mappedSystems.has(systemForRoad(e.name)?.id)),...geometry].sort((a,b)=>a.pointIndex-b.pointIndex).map(e=>e.name);
  const charges=priceTollSection(pricingNames,tariffs,points,section);
  const fare=charges.every(c=>c.fare!==null)?charges.reduce((sum,c)=>sum+c.fare,0):null;
  return {names,exitRoads,charges,fare,start:points[section.startPointIndex],end:points[section.endPointIndex]};
 });
 // A ramp fragment may repeat the entry/exit plaza of its adjacent mainline section.
 for(let i=0;i<tolls.length-1;i++){
  const a=tolls[i].charges,b=tolls[i+1].charges,left=sections[i],right=sections[i+1];
  if(a.length!==1||b.length!==1||a[0].type!=='closed'||b[0].systemId!==a[0].systemId)continue;
  const shared=a[0].entry&&a[0].entry===a[0].exit&&a[0].exit===b[0].entry?a[0].entry:b[0].entry&&b[0].entry===b[0].exit&&a[0].exit===b[0].entry?b[0].entry:null;
  if(!shared||!continuousTollGap(points,left.endPointIndex,right.startPointIndex,a[0].systemId))continue;
  const gate=matchBoundaryGate(points,left.endPointIndex,a[0].systemId);
  if(!gate||gate.name!==shared||gatePassages(points,left.startPointIndex,right.endPointIndex,gate)!==1)continue;
  const merged={...left,endPointIndex:right.endPointIndex};
  const allSections=(route.sections||[]).filter(s=>s!==left&&s!==right);allSections.push(merged);allSections.sort((a,b)=>a.startPointIndex-b.startPointIndex);
  return tripSummary({...route,sections:allSections},tariffs);
 }
 // An exit ramp can be split into another toll section without a new motorway entry.
 // Keep its payment unresolved rather than adding a second open-system fare without evidence.
 for(let i=1;i<tolls.length;i++){
  const previous=tolls[i-1].charges.at(-1),current=tolls[i].charges[0];
  if(previous?.type!=='open'||current?.systemId!==previous.systemId)continue;
  const maneuvers=instructions.filter(instruction=>instruction.pointIndex>=sections[i-1].startPointIndex&&instruction.pointIndex<sections[i].endPointIndex);
  const previousExit=maneuvers.filter(instruction=>instruction.pointIndex<sections[i-1].endPointIndex&&['TAKE_EXIT','MOTORWAY_EXIT_LEFT','MOTORWAY_EXIT_RIGHT'].includes(instruction.maneuver)).at(-1);
  if(!previousExit||maneuvers.some(instruction=>instruction.pointIndex>previousExit.pointIndex&&['ENTER_MOTORWAY','ENTER_FREEWAY','ENTER_HIGHWAY','ENTRANCE_RAMP'].includes(instruction.maneuver)))continue;
  current.fare=null;current.reason='Pembayaran ulang setelah keluar tol belum dapat dipastikan';tolls[i].fare=null;
 }
 const complete=tolls.every(t=>t.fare!==null);
 return {distance:route.summary.lengthInMeters,duration:route.summary.travelTimeInSeconds,tolls,total:complete?tolls.reduce((s,t)=>s+t.fare,0):null,knownSubtotal:tolls.flatMap(t=>t.charges).reduce((s,c)=>s+(c.fare??0),0)};
}
