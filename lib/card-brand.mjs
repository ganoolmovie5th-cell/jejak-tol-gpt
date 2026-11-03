// Visual hint only: a known prefix is not proof that a card exists or is valid.
const brands={flazz:{id:'flazz',name:'Flazz BCA'},emoney:{id:'emoney',name:'Mandiri e-Money'},tapcash:{id:'tapcash',name:'BNI TapCash'},brizzi:{id:'brizzi',name:'BRIZZI'}};
export function detectCardBrand(value){
 const number=String(value??'').replace(/[\s-]/g,'');
 if(!/^\d{15,16}$/.test(number))return null;
 if(number.length===15)return number.startsWith('145')?brands.flazz:null;
 const id=number.startsWith('0145')?'flazz':number.startsWith('603298')?'emoney':number.startsWith('7546')?'tapcash':number.startsWith('601350')?'brizzi':null;
 return id?brands[id]:null;
}
