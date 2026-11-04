# JejakTol GTM configuration

Container: GTM-5DMPHWB2. GA4: G-YVM1Z7BV1F.

Code emits only fixed event names; no card number, date range, route, balance or receipt data.
- toll_search_success: once after every search job finishes successfully (including an empty result). No event on cancellation, failure or partial result.
- toll_pdf_download: after savePDF resolves and the browser download is initiated. This does not prove the user saved the file.

## Dashboard changes still required

1. Pause the old GTM-v1 tag that sends GA4-v1 on three startup triggers.
2. On Google Analytics G-YVM1Z7BV1F, retain only Initialization - All Pages. Remove All Pages and Consent Initialization triggers.
3. Create a Custom Event trigger named toll_search_success (exact match), and a GA4 Event tag with measurement ID G-YVM1Z7BV1F and event name toll_search_success using that trigger.
4. Repeat for toll_pdf_download. No custom parameters or user properties.
5. Preview: confirm one page_view per page load, no GA4-v1 hits, one matching event per completed action. Confirm canceled/failed searches do not fire success.
6. Submit and publish the workspace, then verify the published container and GA4 DebugView.

The code removes the redundant gtag js initialization, retaining one standard gtm.js initialization. Dashboard changes and publication are not yet performed: browser-control tools became unavailable during the task.
