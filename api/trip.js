import {validPosition,tripSummary} from '../lib/trip-route.mjs';
import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
const windows=new Map();
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');res.setHeader('Content-Type','application/json; charset=utf-8');
 const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'Gunakan POST.'});}
 if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Permintaan lintas situs ditolak.'});
 if(!String(req.headers['content-type']||'').includes('application/json'))return send(415,{error:'Gunakan JSON.'});
 let body;try{const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(!raw||raw.length>2048)throw Error();body=JSON.parse(raw);if(!body||!['places','route'].includes(body.action))throw Error();if(body.action==='places'&&(typeof body.query!=='string'||body.query.trim().length<3||body.query.length>200))throw Error();if(body.action==='route'&&(!validPosition(body.origin)||!validPosition(body.destination)))throw Error();}catch{return send(400,{error:'Lokasi tidak valid. Pilih lokasi di Indonesia.'});}
 const key=(process.env.tomtom_api_key||process.env.TOMTOM_API_KEY||'').trim();
 if(!key)return send(503,{error:'Layanan rute belum dikonfigurasi.'});
 const now=Date.now();for(const [k,v] of windows)if(v.until<now)windows.delete(k);
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0];const limit=windows.get(ip)||{until:now+60000,count:0};
 if(limit.count>=12){res.setHeader('Retry-After','60');return send(429,{error:'Terlalu banyak pencarian. Coba lagi dalam satu menit.'});}limit.count++;windows.set(ip,limit);
 const get=async(path,params)=>{const url=new URL(path,'https://api.tomtom.com');url.search=new URLSearchParams({...params,key});const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok){const error=Error();error.status=r.status;console.warn('TomTom request failed',r.status);throw error;}return r.json();};
 try{
  if(body.action==='places'){
   const data=await get(`/search/2/search/${encodeURIComponent(body.query.trim())}.json`,{countrySet:'ID',limit:'5',language:'id-ID'});
   return send(200,{places:(data.results||[]).filter(p=>p.address?.countryCode==='ID'&&validPosition(p.position)).map(p=>({name:[p.poi?.name,p.address?.freeformAddress].filter(Boolean).join(' · '),position:p.position}))});
  }
  const a=body.origin,b=body.destination;
  const data=await get(`/routing/1/calculateRoute/${a.lat},${a.lon}:${b.lat},${b.lon}/json`,{travelMode:'car',routeType:'fastest',traffic:'true',sectionType:'tollRoad',instructionsType:'coded',language:'id-ID'});
  if(!data.routes?.length)return send(422,{error:'Rute tidak ditemukan. Coba lokasi lain.'});
  const tariffs=await fetchTripTariffs();
  return send(200,{...tripSummary(data.routes[0],tariffs.rows),calculatedAt:new Date().toISOString(),tariffsAvailable:tariffs.rows.length>0,tariffFetchedAt:tariffs.fetchedAt});
 }catch(error){return send(error.status===429?429:502,{error:error.status===429?'Kuota layanan rute sedang terbatas. Coba lagi nanti.':[401,403].includes(error.status)?'Akses TomTom ditolak. Periksa izin Search dan Routing pada API key.':error.status===400?'Parameter layanan rute belum didukung.':'Rute belum dapat dimuat. Periksa lokasi atau coba lagi nanti.'});}
}
