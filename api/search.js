import { validateQuery, searchOperator } from '../lib/operators.mjs';
const windows = new Map();
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store, private');res.setHeader('Content-Type','application/json; charset=utf-8');
  const send=(status,body)=>{res.statusCode=status;res.end(JSON.stringify(body));};
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'Gunakan POST.'});}
  if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Permintaan lintas situs ditolak.'});
  if(!String(req.headers['content-type']||'').includes('application/json'))return send(415,{error:'Gunakan JSON.'});
  const now=Date.now();for(const [k,v] of windows)if(v.until<now)windows.delete(k);
  const key=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'local').split(',')[0];
  const current=windows.get(key)||{until:now+60000,count:0};
  if(current.count>=12){res.setHeader('Retry-After','60');return send(429,{error:'Terlalu banyak pencarian. Tunggu satu menit.'});}
  current.count++;windows.set(key,current);
  try {
    const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});
    if(raw.length>4096)return send(413,{error:'Permintaan terlalu besar.'});
    const query=validateQuery(JSON.parse(raw));
    const result=await searchOperator(query);
    return send(200,result);
  } catch(e) {return send(400,{error:e instanceof SyntaxError?'JSON tidak valid.':e.message});}
}
