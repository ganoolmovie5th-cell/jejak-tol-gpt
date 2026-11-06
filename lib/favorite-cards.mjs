const KEY='jejaktol.favorite-cards.v1';
export function readFavorites(storage){
 const raw=JSON.parse(storage.getItem(KEY)||'[]');
 if(!Array.isArray(raw))return [];
 const seen=new Set();
 return raw.filter(item=>item&&/^\d{15,16}$/.test(item.card)&&typeof item.name==='string'&&!seen.has(item.card)&&seen.add(item.card)).slice(0,10).map(({card,name})=>({card,name:name.slice(0,40)}));
}
export function saveFavorite(storage,card,name){
 card=String(card).replace(/\s/g,'');name=String(name).trim();
 if(!/^\d{15,16}$/.test(card))throw Error('Masukkan nomor kartu 15–16 digit sebelum menyimpan.');
 if(!name||name.length>40)throw Error('Isi nama kartu, maksimal 40 karakter.');
 const list=readFavorites(storage);const existing=list.find(item=>item.card===card);
 if(existing)existing.name=name;
 else {if(list.length>=10)throw Error('Maksimal 10 kartu favorit. Hapus salah satu terlebih dahulu.');list.push({card,name});}
 storage.setItem(KEY,JSON.stringify(list));return list;
}
export function removeFavorite(storage,card){const list=readFavorites(storage).filter(item=>item.card!==card);if(list.length)storage.setItem(KEY,JSON.stringify(list));else storage.removeItem(KEY);return list;}
export function clearFavorites(storage){storage.removeItem(KEY);}
