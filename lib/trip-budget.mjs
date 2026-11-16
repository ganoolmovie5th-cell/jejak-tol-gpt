import {travelDays,holidaySource} from './trip-calendar.mjs';
import {money} from '../receipts.js';
export function setupTripBudget(host,total){
 host.innerHTML=`<details open><summary>Anggaran perjalanan rutin</summary><div class="trip-fields"><label>Bulan<input type="month" id="budget-month" min="2026-01" max="2026-12" value="${new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'}).slice(0,7)}"></label><label>Hari perjalanan<select id="budget-days"><option value="weekday">Weekday (Senin–Jumat)</option><option value="weekend">Weekend (Sabtu–Minggu)</option><option value="both">Both (setiap hari)</option></select></label></div><label><input type="checkbox" id="budget-holidays" checked> Tidak menghitung libur nasional</label><p>Estimasi satu perjalanan searah per hari. Cuti bersama tetap dihitung. Kalender tersedia untuk 2026.</p><p id="budget-result" role="status"></p><a href="${holidaySource}" target="_blank" rel="noopener noreferrer">Kalender resmi 2026</a></details>`;
 const update=()=>{const out=host.querySelector('#budget-result');try{const {dates,excluded}=travelDays(host.querySelector('#budget-month').value,host.querySelector('#budget-days').value,host.querySelector('#budget-holidays').checked);out.textContent=`${dates.length} hari perjalanan · ${excluded} libur dikecualikan · ${!Number.isFinite(total)||total<0?'Biaya belum lengkap':money(total*dates.length)}`;}catch(e){out.textContent=e.message;}};
 host.addEventListener('change',update);update();
 return value=>{total=value;update();};
}
