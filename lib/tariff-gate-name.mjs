export function tariffGateName(value){
 const name=String(value||'').trim().replace(/\s+/g,' ');
 if(['Kalikangkung','Semarang/Kali Kangkung','Semarang/Kalikangkung'].includes(name))return 'Semarang/Kalikangkung';
 if(/^WRR\s*\/\s*Warugunung(?: \(Tertutup\))?$/.test(name))return 'WRR/Warugunung';
 if(name==='Bandara Adi Suamrmo')return 'Bandara Adi Sumarmo';
 return name;
}
