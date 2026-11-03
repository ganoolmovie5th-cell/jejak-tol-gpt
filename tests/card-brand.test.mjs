import test from 'node:test';
import assert from 'node:assert/strict';
import {detectCardBrand} from '../lib/card-brand.mjs';
test('known full card numbers produce visual brand hints without changing input',()=>{
 for(const [number,id] of [['0145000000000000','flazz'],['145000000000000','flazz'],['6032980000000000','emoney'],['7546000000000000','tapcash'],['6013500000000000','brizzi']])assert.equal(detectCardBrand(number)?.id,id);
 assert.equal(detectCardBrand('7546 0000-0000 0000')?.id,'tapcash');
});
test('partial, unknown and malformed numbers do not guess a card brand',()=>{
 for(const n of ['',null,'7546','754600000000000','75460000000000000','9999999999999999','x7546000000000000','6032000000000000'])assert.equal(detectCardBrand(n),null);
});
