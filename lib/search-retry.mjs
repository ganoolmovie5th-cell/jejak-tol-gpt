import {abortableDelay,mergeTransactions} from './search-plan.mjs';
export async function searchWithRetry(payload,{signal,fetcher=fetch,delay=abortableDelay,onRetry=()=>{}}={}){
 let combined=null;
 for(let attempt=0;attempt<3;attempt++){
  signal?.throwIfAborted();let response,data,wait=6100*(attempt+1);
  try{
   response=await fetcher('/api/search',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
   if(!response.ok){const error=new Error('Pencarian gagal.');error.retryable=response.status===408||response.status===429||response.status>=500;const retryAfter=response.headers.get('Retry-After');if(retryAfter){const seconds=Number(retryAfter);wait=Math.max(wait,Number.isFinite(seconds)?seconds*1000:Date.parse(retryAfter)-Date.now()||0);}throw error;}
   data=await response.json();
  }catch(error){
   if(signal?.aborted||error.name==='AbortError')throw error;
   if(attempt===2||!(error.retryable||error instanceof TypeError))throw error;
   onRetry(attempt+1,wait);await delay(wait,signal);continue;
  }
  if(combined){data.transactions=mergeTransactions(combined.transactions,data.transactions);data.sources=data.sources.map(s=>s.status==='error'?(combined.sources.find(old=>old.source===s.source&&old.status==='success')||s):s);}
  combined=data;
  if(attempt===2||!data.sources.some(s=>s.status==='error'&&s.retryable))return data;
  wait=Math.max(wait,...data.sources.map(s=>s.retryAfterMs||0));
  onRetry(attempt+1,wait);await delay(wait,signal);
 }
}
export function transientError(error){return error.name==='TimeoutError'||error instanceof TypeError||error.retryable===true;}
export function httpError(status,retryAfter){const error=new Error(status===429?'Operator membatasi permintaan. Coba lagi nanti.':`Operator merespons HTTP ${status}.`);error.retryable=status===408||status===429||status>=500;const seconds=Number(retryAfter);error.retryAfterMs=status===429?Math.max(60000,Number.isFinite(seconds)?seconds*1000:Date.parse(retryAfter)-Date.now()||0):0;return error;}
