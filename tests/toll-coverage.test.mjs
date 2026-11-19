import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditPairs} from '../scripts/audit-toll-coverage.mjs';
const row=(origin,destination,fare=100)=>({road:'A',origin,destination,fares:[fare]});
test('coverage audit reports missing reverse directions without synthesizing fares',()=>{
 const result=auditPairs([row('Kanci','Pejagan')]);
 assert.equal(result.directedPairs,1);assert.deepEqual(result.missingReversePairs,[{road:'A',origin:'Pejagan',destination:'Kanci'}]);
 assert.deepEqual(auditPairs([row('Kanci','Pejagan'),row('Pejagan','Kanci')]).missingReversePairs,[]);
});
test('coverage audit normalizes known boundary spellings and exposes duplicate or invalid prices',()=>{
 const r=auditPairs([row('Kalikangkung','Batang'),row('Batang','Semarang/Kali Kangkung'),row('Kalikangkung','Batang')]);
 assert.equal(r.directedPairs,2);assert.equal(r.missingReversePairs.length,0);assert.equal(r.invalidOrDuplicatePairs.length,1);
 for(const value of [null,-1,NaN])assert.equal(auditPairs([row('A','B',value)]).invalidOrDuplicatePairs.length,1);
 assert.equal(auditPairs([row('','B'),row('A','A')]).directedPairs,0);
});
