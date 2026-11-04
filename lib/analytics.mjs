// Only fixed event names enter GTM. Never include card numbers, dates or receipt data.
const allowedEvents = new Set(['toll_search_success', 'toll_pdf_download']);
export function trackEvent(name, target = globalThis.window) {
  if (!allowedEvents.has(name) || !target) return;
  try {
    target.dataLayer = target.dataLayer || [];
    target.dataLayer.push({event: name});
  } catch { /* Analytics must never interrupt search or PDF creation. */ }
}
