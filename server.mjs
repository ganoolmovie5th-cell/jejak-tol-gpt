import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,resolve,sep} from 'node:path';
import handler from './api/search.js';
const root=resolve('dist');
http.createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/api/search'){
  let body='';for await(const chunk of req){body+=chunk;if(body.length>4096){res.writeHead(413);res.end();return;}}
  req.body=body;return handler(req,res);
 }
 const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!path.startsWith(root+sep)){res.writeHead(403);return res.end();}
 try{if(!(await stat(path)).isFile())throw new Error();const mime={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2'};res.setHeader('Content-Type',mime[extname(path)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(path));}catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('SakuKartu: http://127.0.0.1:4173'));
