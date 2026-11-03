// A visible search default, not a claim about operator retention or launch dates.
export const ARCHIVE_START = '1970-01-01';
export function searchWindows(start,end){
 const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s.slice(0,4)!=='0000'&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(start)||!valid(end)||start>end)throw new Error('Tanggal tidak valid.');
 const windows=[];let finish=end;
 // Five calendar years per request, newest first. There is no total range limit.
 while(finish>=start){
  const year=Number(finish.slice(0,4));
  const begin=[String(Math.max(1,year-4)).padStart(4,'0')+'-01-01',start].sort().at(-1);
  windows.push({start:begin,end:finish});
  if(begin===start)break;
  const previous=new Date(begin+'T00:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);finish=previous.toISOString().slice(0,10);
 }
 return windows;
}
export function mergeTransactions(current,incoming){return [...new Map([...current,...incoming].map(row=>[row.id,row])).values()];}
export function abortableDelay(ms,signal){return new Promise((resolve,reject)=>{if(signal.aborted)return reject(new DOMException('Dibatalkan','AbortError'));const abort=()=>{clearTimeout(timer);reject(new DOMException('Dibatalkan','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve();},ms);signal.addEventListener('abort',abort,{once:true});});}
