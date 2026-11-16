export const holidaySource='https://www.setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2026';
const holidays=new Set(['01-01','01-16','02-17','03-19','03-21','03-22','04-03','04-05','05-01','05-14','05-27','05-31','06-01','06-16','08-17','08-25','12-25']);
export function receiptDayMatches(dateTime,mode='all'){
 if(mode==='all')return true;
 const key=String(dateTime||'').slice(0,10),date=new Date(key+'T00:00:00Z');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==key)return false;
 if(mode==='holiday')return key.startsWith('2026-')&&holidays.has(key.slice(5));
 const weekend=[0,6].includes(date.getUTCDay());
 return mode==='weekday'?!weekend:mode==='weekend'?weekend:false;
}
