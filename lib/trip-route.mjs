import {priceTollSection} from './toll-network.mjs';
const normalized=s=>String(s||'').toLowerCase().replace(/\b(jalan|jl|tol|toll|road)\b/g,'').replace(/[^a-z0-9]/g,'');
export function validPosition(p){return p&&typeof p.lat==='number'&&typeof p.lon==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=-11.5&&p.lat<=6.5&&p.lon>=94&&p.lon<=142;}
export function tripSummary(route,tariffs=[]){
 if(!Number.isFinite(route?.summary?.lengthInMeters)||route.summary.lengthInMeters<0||!Number.isFinite(route?.summary?.travelTimeInSeconds)||route.summary.travelTimeInSeconds<0||!Array.isArray(route.legs)||!Array.isArray(route.guidance?.instructions))throw Error('Invalid route');
 const points=route.legs.flatMap(l=>l.points||[]),instructions=route.guidance.instructions;
 const sections=(route.sections||[]).filter(s=>s.sectionType==='TOLL_ROAD');
 const tolls=sections.map(section=>{
  if(!Number.isInteger(section.startPointIndex)||!Number.isInteger(section.endPointIndex)||!points[section.startPointIndex]||!points[section.endPointIndex])throw Error('Invalid toll section');
  const names=[],exitRoads=[];
  const relevant=instructions.filter(i=>i.pointIndex>=section.startPointIndex&&i.pointIndex<section.endPointIndex);
  let exiting=false;
  for(const i of relevant){
   const name=String(i.street||'').trim();if(!name)continue;
   // Guidance names the road AFTER the maneuver, even when its point is still on a tolled exit ramp.
   if(['TAKE_EXIT','MOTORWAY_EXIT_LEFT','MOTORWAY_EXIT_RIGHT'].includes(i.maneuver))exiting=true;
   if(['ENTER_MOTORWAY','ENTER_FREEWAY','ENTER_HIGHWAY'].includes(i.maneuver))exiting=false;
   const tollName=/\b(tol|toll)\b/i.test(name)||['jagorawi','jakartabogorciawi'].includes(normalized(name));
   const target=exiting&&!tollName?exitRoads:names;
   if(target.at(-1)!==name)target.push(name);
  }
  const charges=priceTollSection(names,tariffs,points,section);
  const fare=charges.every(c=>c.fare!==null)?charges.reduce((sum,c)=>sum+c.fare,0):null;
  return {names,exitRoads,charges,fare,start:points[section.startPointIndex],end:points[section.endPointIndex]};
 });
 const complete=tolls.every(t=>t.fare!==null);
 return {distance:route.summary.lengthInMeters,duration:route.summary.travelTimeInSeconds,tolls,total:complete?tolls.reduce((s,t)=>s+t.fare,0):null,knownSubtotal:tolls.flatMap(t=>t.charges).reduce((s,c)=>s+(c.fare??0),0)};
}
