const normalized=s=>String(s||'').toLowerCase().replace(/\b(jalan|jl|tol|toll|road)\b/g,'').replace(/[^a-z0-9]/g,'');
export function validPosition(p){return p&&typeof p.lat==='number'&&typeof p.lon==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=-11.5&&p.lat<=6.5&&p.lon>=94&&p.lon<=142;}
export function tripSummary(route,tariffs=[]){
 if(!route?.summary||!Array.isArray(route.legs)||!Array.isArray(route.guidance?.instructions))throw Error('Invalid route');
 const points=route.legs.flatMap(l=>l.points||[]),instructions=route.guidance.instructions;
 const sections=(route.sections||[]).filter(s=>s.sectionType==='TOLL_ROAD');
 const tolls=sections.map(section=>{
  if(!Number.isInteger(section.startPointIndex)||!Number.isInteger(section.endPointIndex)||!points[section.startPointIndex]||!points[section.endPointIndex])throw Error('Invalid toll section');
  const names=[];
  const relevant=instructions.filter(i=>i.pointIndex>=section.startPointIndex&&i.pointIndex<section.endPointIndex);
  for(const i of relevant){const name=String(i.street||'').trim();if(name&&!names.includes(name))names.push(name);}
  // shortcut: price only a continuous Jagorawi-only section; expand after gate/billing-system mappings are verified.
  const jagorawi=names.length>0&&names.every(n=>['jagorawi','jakartabogorciawi'].includes(normalized(n)));
  const fares=tariffs.filter(r=>normalized(r.road)==='jakartabogorciawi').map(r=>r.fares[0]);
  const fare=jagorawi&&fares.length===1&&Number.isFinite(fares[0])?fares[0]:null;
  return {names,fare,start:points[section.startPointIndex],end:points[section.endPointIndex]};
 });
 const complete=tolls.every(t=>t.fare!==null);
 return {distance:route.summary.lengthInMeters,duration:route.summary.travelTimeInSeconds,tolls,total:complete?tolls.reduce((s,t)=>s+t.fare,0):null,knownSubtotal:tolls.reduce((s,t)=>s+(t.fare??0),0)};
}
