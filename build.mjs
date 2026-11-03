import { build } from 'esbuild';
import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const f of ['index.html','style.css','receipt.css','logo.svg','robots.txt','sitemap.xml'])await copyFile(f,`dist/${f}`);
await cp('assets','dist/assets',{recursive:true});
await build({entryPoints:['app.js'],bundle:true,splitting:true,format:'esm',outdir:'dist',entryNames:'app',chunkNames:'chunks/[name]-[hash]',assetNames:'assets/[name]-[hash]',loader:{'.woff': 'file','.woff2':'file'},minify:true,target:['es2022'],logLevel:'info'});
