import test from 'node:test';import assert from 'node:assert/strict';
import {searchWindows,mergeTransactions,abortableDelay,ARCHIVE_START} from '../lib/search-plan.mjs';
import {validateQuery} from '../lib/operators.mjs';
test('accepts historical and multi-year date ranges beyond 93 days',()=>{for(const start of ['1970-01-01','1990-01-01','2024-01-01'])assert.equal(validateQuery({card:'1234567890123456',operator:'astra',start,end:'2026-10-31'}).start,start);});
test('archive windows cover every day exactly once newest first',()=>{
 const windows=searchWindows(ARCHIVE_START,'2026-11-03');assert.equal(windows[0].end,'2026-11-03');assert.equal(windows.at(-1).start,ARCHIVE_START);
 for(let i=0;i<windows.length-1;i++)assert.equal(Date.parse(windows[i].start)-Date.parse(windows[i+1].end),86400000);
 assert.deepEqual(searchWindows('2024-02-29','2024-02-29'),[{start:'2024-02-29',end:'2024-02-29'}]);
});
test('merged results deduplicate without deleting previous matches',()=>assert.deepEqual(mergeTransactions([{id:'a'},{id:'b'}],[{id:'b'},{id:'c'}]),[{id:'a'},{id:'b'},{id:'c'}]));
test('cancel interrupts pacing immediately',async()=>{const c=new AbortController();const wait=abortableDelay(60000,c.signal);c.abort();await assert.rejects(wait,{name:'AbortError'});await assert.rejects(abortableDelay(60000,c.signal),{name:'AbortError'});});
test('rejects invalid planning dates instead of looping',()=>{for(const start of ['0000-01-01','2026-02-30','invalid','2027-01-01'])assert.throws(()=>searchWindows(start,'2026-11-03'));assert.deepEqual(searchWindows('0001-01-01','0001-01-01'),[{start:'0001-01-01',end:'0001-01-01'}]);});
