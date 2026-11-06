import {parseTariffs,TARIFF_CSV,TARIFF_SOURCE} from '../lib/toll-tariffs.mjs';
export default async function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method!=='GET'){res.statusCode=405;res.setHeader('Allow','GET');return res.end(JSON.stringify({error:'Gunakan GET.'}));}
 try{const response=await fetch(TARIFF_CSV,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();const text=await response.text();if(text.length>3000000)throw Error();const rows=parseTariffs(text);res.setHeader('Cache-Control','public, max-age=300, s-maxage=3600');res.end(JSON.stringify({rows,source:TARIFF_SOURCE,fetchedAt:new Date().toISOString()}));}
 catch{res.statusCode=502;res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({error:'Data tarif BPJT belum dapat diambil. Silakan buka sumber resmi.'}));}
}
