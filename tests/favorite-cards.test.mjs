import test from 'node:test';
import assert from 'node:assert/strict';
import {readFavorites,saveFavorite,removeFavorite,clearFavorites} from '../lib/favorite-cards.mjs';
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('favorites persist exact digits including leading zero; duplicates update name and removal clears storage',()=>{
 const storage=memory();saveFavorite(storage,'0145 0000 0000 0001','Mobil');saveFavorite(storage,'0145000000000001','Mobil keluarga');
 assert.deepEqual(readFavorites(storage),[{card:'0145000000000001',name:'Mobil keluarga'}]);
 assert.deepEqual(removeFavorite(storage,'0145000000000001'),[]);assert.equal(storage.getItem('jejaktol.favorite-cards.v1'),null);
});
test('invalid inputs and blocked storage cannot produce a successful save',()=>{
 const storage=memory();assert.throws(()=>saveFavorite(storage,'123','Mobil'));assert.throws(()=>saveFavorite(storage,'0145000000000001',' '));
 assert.deepEqual(readFavorites(storage),[]);assert.throws(()=>saveFavorite({getItem(){throw Error('blocked')}},'0145000000000001','Mobil'));
});
test('corrupt data can be cleared; card limit prevents unbounded storage',()=>{
 const storage=memory();storage.setItem('jejaktol.favorite-cards.v1','{');assert.throws(()=>readFavorites(storage));clearFavorites(storage);assert.deepEqual(readFavorites(storage),[]);
 for(let n=0;n<10;n++)saveFavorite(storage,'014500000000000'+n,'Kartu '+n);
 assert.throws(()=>saveFavorite(storage,'0145000000000010','Kartu 11'));assert.equal(readFavorites(storage).length,10);
});
