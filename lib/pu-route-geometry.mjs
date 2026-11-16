import mainlines from '../data/toll-mainlines.json' with {type:'json'};
import data from '../data/pu-toll-network.json' with {type:'json'};
const distance=(p,a,b,previous)=>{
 const scale=Math.cos(p.latitude*Math.PI/180),x=(a[0]-p.longitude)*111320*scale,y=(a[1]-p.latitude)*111320,dx=(b[0]-a[0])*111320*scale,dy=(b[1]-a[1])*111320;
 if(previous){const rx=(p.longitude-previous.longitude)*111320*scale,ry=(p.latitude-previous.latitude)*111320;const lengths=Math.hypot(rx,ry)*Math.hypot(dx,dy);if(!lengths||Math.abs(rx*dx+ry*dy)/lengths<0.9)return Infinity;}
 const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x+t*dx,y+t*dy);
};
export function junctionEvents(points,section,junctions=[...data.junctions,...mainlines.roads]){
 const events=[];
 for(const junction of junctions){
  const all=junction.paths.flat();if(!all.length)continue;
  const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),box=[Math.min(...xs)-0.0004,Math.max(...xs)+0.0004,Math.min(...ys)-0.0004,Math.max(...ys)+0.0004];
  let previous=-1,start=-1;
  for(let i=section.startPointIndex;i<=section.endPointIndex;i++){
   const p=points[i];if(!p||p.longitude<box[0]||p.longitude>box[1]||p.latitude<box[2]||p.latitude>box[3])continue;
   const hit=junction.paths.some(path=>path.some((a,k)=>{if(!k)return false;const b=path[k-1];if(p.longitude<Math.min(a[0],b[0])-0.0002||p.longitude>Math.max(a[0],b[0])+0.0002||p.latitude<Math.min(a[1],b[1])-0.0002||p.latitude>Math.max(a[1],b[1])+0.0002)return false;return distance(p,b,a,points[i-1])<=15;}));
   if(!hit)continue;
   // shortcut: require two route samples at least 60 m apart on the same ramp; unmatched or newer geometry remains unknown.
   if(start<0||i-previous>10)start=i;
   previous=i;const a=points[start];
   if(Math.hypot((p.longitude-a.longitude)*110000,(p.latitude-a.latitude)*111320)>=60){events.push({pointIndex:start,system:junction.system});break;}
  }
 }
 return events.sort((a,b)=>a.pointIndex-b.pointIndex);
}
