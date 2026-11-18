import mainlines from '../data/toll-mainlines.json' with {type:'json'};
import data from '../data/pu-toll-network.json' with {type:'json'};
import karawaci from '../data/pu-karawaci-junction.json' with {type:'json'};
const distance=(p,a,b,previous)=>{
 const scale=Math.cos(p.latitude*Math.PI/180),x=(a[0]-p.longitude)*111320*scale,y=(a[1]-p.latitude)*111320,dx=(b[0]-a[0])*111320*scale,dy=(b[1]-a[1])*111320;
 if(previous){const rx=(p.longitude-previous.longitude)*111320*scale,ry=(p.latitude-previous.latitude)*111320;const lengths=Math.hypot(rx,ry)*Math.hypot(dx,dy);if(!lengths||Math.abs(rx*dx+ry*dy)/lengths<0.9)return Infinity;}
 const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x+t*dx,y+t*dy);
};
function indexGeometry(features){
 const grid=new Map();
 for(const f of features)for(const path of f.paths)for(let k=1;k<path.length;k++){
  const a=path[k-1],b=path[k],segment={a,b,system:f.system};
  for(let x=Math.floor((Math.min(a[0],b[0])-0.0002)*100);x<=Math.floor((Math.max(a[0],b[0])+0.0002)*100);x++)for(let y=Math.floor((Math.min(a[1],b[1])-0.0002)*100);y<=Math.floor((Math.max(a[1],b[1])+0.0002)*100);y++){
   const key=`${x}:${y}`;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(segment);
  }
 }
 return grid;
}
const defaultGrid=indexGeometry([...data.junctions,...karawaci.junctions,...mainlines.roads]);
export function junctionEvents(points,section,features){
 const grid=features?indexGeometry(features):defaultGrid,events=[];let run=null;
 for(let i=section.startPointIndex;i<=section.endPointIndex;i++){
  const p=points[i];if(!p)continue;const candidates=grid.get(`${Math.floor(p.longitude*100)}:${Math.floor(p.latitude*100)}`)||[],scores=new Map();
  for(const s of candidates){const d=distance(p,s.a,s.b,points[i-1]);if(d<=15)scores.set(s.system,Math.min(d,scores.get(s.system)??Infinity));}
  const sorted=[...scores].sort((a,b)=>a[1]-b[1]);
  if(!sorted.length||(sorted[1]&&sorted[1][1]-sorted[0][1]<3)){run=null;continue;}
  const system=sorted[0][0];if(!run||run.system!==system)run={system,start:i,emitted:false};
  const a=points[run.start];
  // shortcut: require 60 m of aligned, unambiguous overlap; newer or unmatched geometry remains unknown.
  if(!run.emitted&&Math.hypot((p.longitude-a.longitude)*110000,(p.latitude-a.latitude)*111320)>=60){
   if(events.at(-1)?.system!==system)events.push({pointIndex:run.start,system});run.emitted=true;
  }
 }
 return events;
}

// Join only short gaps whose entire route follows the same published toll geometry.
export function continuousTollGap(points,start,end,system,features){
 if(end<=start)return false;
 const grid=features?indexGeometry(features):defaultGrid;let length=0;
 for(let i=start+1;i<=end;i++){
  const a=points[i-1],b=points[i],metres=Math.hypot((b.longitude-a.longitude)*111320*Math.cos(a.latitude*Math.PI/180),(b.latitude-a.latitude)*111320);
  length+=metres;if(length>1500)return false;
  if(!metres)continue;
  const steps=Math.ceil(metres/20);
  for(let step=0;step<=steps;step++){
   const t=step/steps,p={latitude:a.latitude+(b.latitude-a.latitude)*t,longitude:a.longitude+(b.longitude-a.longitude)*t};
   const candidates=grid.get(`${Math.floor(p.longitude*100)}:${Math.floor(p.latitude*100)}`)||[],scores=new Map();
   for(const s of candidates){const d=distance(p,s.a,s.b);if(d<=15)scores.set(s.system,Math.min(d,scores.get(s.system)??Infinity));}
   const ranked=[...scores].sort((a,b)=>a[1]-b[1]);
   if(ranked[0]?.[0]!==system||(ranked[1]&&ranked[1][1]-ranked[0][1]<3))return false;
  }
 }
 return length>0;
}
