export const holidaySource='https://www.setneg.go.id/baca/index/inilah_skb_3_menteri_libur_nasional_dan_cuti_bersama_2026';
const holidays=new Set(['01-01','01-16','02-17','03-19','03-21','03-22','04-03','04-05','05-01','05-14','05-27','05-31','06-01','06-16','08-17','08-25','12-25']);
export function travelDays(month,mode='weekday',excludeHolidays=true){
 if(!/^2026-(0[1-9]|1[0-2])$/.test(month)||!['weekday','weekend','both'].includes(mode))throw Error('Kalender tersedia untuk tahun 2026.');
 const dates=[];let excluded=0;
 for(let day=1;day<=31;day++){const date=new Date(Date.UTC(2026,Number(month.slice(5))-1,day));if(date.getUTCMonth()!==Number(month.slice(5))-1)break;const weekend=[0,6].includes(date.getUTCDay());if(mode==='weekday'&&weekend||mode==='weekend'&&!weekend)continue;const key=date.toISOString().slice(0,10);if(excludeHolidays&&holidays.has(key.slice(5))){excluded++;continue;}dates.push(key);}
 return {dates,excluded};
}
