// Fixed names only. No card numbers, dates, routes, amounts or error text.
const allowedEvents = new Set(['toll_search_success','toll_pdf_download','toll_search_start','toll_search_partial','toll_search_failed','toll_search_cancelled','toll_search_retry','toll_csv_download','toll_excel_download','toll_download_failed']);
export function trackEvent(name, target = globalThis.window) {
 if(!allowedEvents.has(name)||!target)return;
 try{
  target.dataLayer=target.dataLayer||[];
  // Use the Google tag already configured by GTM; no second config or page_view.
  // Arguments objects are the documented gtag command queue format.
  function command(){target.dataLayer.push(arguments);}
  command('event',name,{send_to:'G-YVM1Z7BV1F'});
 }catch{/* Measurement must never interrupt the application. */}
}
