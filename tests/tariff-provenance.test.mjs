import {test} from 'node:test';import assert from 'node:assert/strict';
import {officialLink,tariffProvenance} from '../lib/tariff-provenance.mjs';
import {fetchTripTariffs} from '../lib/toll-tariffs.mjs';
test('source links only allow official HTTPS origins and escape labels',()=>{
 assert.equal(officialLink('javascript:alert(1)','test'),'');assert.equal(officialLink('https://evil.test','test'),'');assert.equal(officialLink('https://user:password@bpjt.pu.go.id','test'),'');
 assert.match(officialLink('https://bpjt.pu.go.id/info-tarif-dan-golongan/','<source>'),/&lt;source&gt;/);
});
test('fare metadata separates retrieval timestamp from effective date',()=>{
 const html=tariffProvenance({tariffsAvailable:true,tariffFetchedAt:'2026-11-08T00:00:00Z'});assert.match(html,/2026-11-08 07:00:00 WIB/);assert.match(html,/bukan tanggal berlaku/);
 const failed=tariffProvenance({tariffsAvailable:false,tariffFetchedAt:'2026-11-08T00:00:00Z'});assert.match(failed,/tidak berhasil dimuat/);assert.ok(!failed.includes('07:00:00'));
});
test('retrieval time is only produced after valid source data',async()=>{
 const original=global.fetch;try{
 global.fetch=async()=>({ok:true,text:async()=>',No.,Tol Trans,Ruas,Panjang Jalan Tol,Besaran Tarif,,Golongan,,\n,,,,,Asal,Tujuan,I,II & III,IV & V\n,1,Jawa,Road,10,A,B,"Rp 7,500","Rp 10,000",-'});
 const result=await fetchTripTariffs();assert.equal(result.rows[0].fares[0],7500);assert.ok(Number.isFinite(Date.parse(result.fetchedAt)));
 global.fetch=async()=>({ok:true,text:async()=>'<html>bad source</html>'});assert.deepEqual(await fetchTripTariffs(),{rows:[],fetchedAt:null});
 }finally{global.fetch=original;}
});
