import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {parseCtpTariffs,CTP_SOURCE} from '../lib/ctp-tariffs.mjs';
import {fetchTripTariffs,TARIFF_CSV} from '../lib/toll-tariffs.mjs';
import {priceTollSection} from '../lib/toll-network.mjs';
import {tariffProvenance} from '../lib/tariff-provenance.mjs';
import gates from '../data/ctp-toll-gates.json' with {type:'json'};
const html=fs.readFileSync(new URL('./fixtures/ctp-tariffs.html',import.meta.url),'utf8');
test('operator discount table retains 28 directed pairs and source attribution',()=>{
 const rows=parseCtpTariffs(html);assert.equal(rows.length,28);assert.equal(rows[0].fares[0],6500);assert.equal(rows[0].source,CTP_SOURCE);
 assert.equal(rows.find(r=>r.origin==='Marunda'&&r.destination==='Tarumajaya').fares[0],14500);
});
test('CTP rejects malformed headers, prices and duplicate pairs',()=>{
 for(const bad of [html.replace('Asal','Origin'),html.replace('6.500','-6.500'),html.replace('</tbody>',html.match(/<tbody[^>]*>(<tr>.*?<\/tr>)/s)[1]+'</tbody>')])assert.throws(()=>parseCtpTariffs(bad));
});
test('verified CTP gate pair prices directly without assuming Gabus equals Tambelang',()=>{
 const a=gates.gates.find(g=>g.tariffName==='Cibitung 1'),b=gates.gates.find(g=>g.tariffName==='Telaga Asih');
 const points=[a,b].map(g=>({latitude:g.lat,longitude:g.lon}));const result=priceTollSection(['Jalan Tol Cibitung-Cilincing'],parseCtpTariffs(html),points,{startPointIndex:0,endPointIndex:1});assert.equal(result[0].fare,6500);assert.equal(result[0].source,CTP_SOURCE);assert.ok(!gates.gates.some(g=>g.tariffName==='Gabus'));
});
test('CTP source can succeed independently of BPJT and records partial source failure',async()=>{
 const original=global.fetch;try{global.fetch=async url=>url===TARIFF_CSV?{ok:false}:{ok:true,text:async()=>html};const result=await fetchTripTariffs();assert.equal(result.rows.length,28);assert.equal(result.sources[0].fetchedAt,null);assert.ok(result.sources[1].fetchedAt);const view=tariffProvenance({tariffsAvailable:true,tariffFetchedAt:result.fetchedAt,tariffSources:result.sources});assert.match(view,/CTP Tollways/);assert.match(view,/Data tidak tersedia/);
 }finally{global.fetch=original;}
});
