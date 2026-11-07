import {load} from 'cheerio';
import {validateQuery} from '../lib/operators.mjs';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 const fail=(code,message)=>{res.statusCode=code;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({error:message}));};
 if(req.method!=='POST')return fail(405,'Gunakan POST.');
 if(req.headers['sec-fetch-site']==='cross-site')return fail(403,'Permintaan lintas situs ditolak.');
 try{
 const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(raw.length>16000)return fail(413,'Permintaan terlalu besar.');
 const input=JSON.parse(raw),q=validateQuery({...input,operator:'jlb'});
 if(!Array.isArray(input.ids)||!input.ids.length||input.ids.length>180||!input.ids.every(id=>typeof id==='string'&&/^\d+$/.test(id)))return fail(400,'Pilihan struk tidak valid.');
 const origin='https://strukdigital.jlbjorrw1.com',cookies=new Map();
 async function request(path,body){const r=await fetch(origin+path,{method:body?'POST':'GET',redirect:'error',signal:AbortSignal.timeout(12000),headers:{Cookie:[...cookies].map(([k,v])=>`${k}=${v}`).join('; '),Referer:origin+'/struk',...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body});if(!r.ok)throw Error('Layanan PDF JLB belum tersedia.');for(const c of r.headers.getSetCookie()){const pair=c.split(';')[0],i=pair.indexOf('=');cookies.set(pair.slice(0,i),pair.slice(i+1));}return r;}
 let html=await (await request('/struk')).text();let token=load(html)('input[name="_token"]').val();if(!token)throw Error('Formulir JLB berubah.');
 html=await(await request('/struk',new URLSearchParams({_token:token,card_number:q.card,start_date:q.start,end_date:q.end}))).text();const $=load(html),allowed=new Set($('input[name="checkboxs[]"]').map((_,el)=>$(el).val()).get());if(!input.ids.every(id=>allowed.has(id)))return fail(400,'Struk tidak ditemukan untuk kartu dan periode ini. Cari ulang transaksi.');
 token=$('input[name="_token"]').first().val();if(!token)throw Error('Formulir unduhan JLB berubah.');const body=new URLSearchParams({_token:token});for(const id of new Set(input.ids))body.append('checkboxs[]',id);
 const response=await request('/download-pdf',body),pdf=Buffer.from(await response.arrayBuffer());if(pdf.length>20000000||pdf.subarray(0,5).toString()!=='%PDF-')throw Error('PDF JLB tidak valid.');res.setHeader('Content-Type','application/pdf');res.setHeader('Content-Disposition','inline; filename="JLB-struk.pdf"');res.end(pdf);
 }catch{fail(502,'PDF asli JLB belum dapat diambil. Coba lagi atau buka situs resmi JLB.');}
}
