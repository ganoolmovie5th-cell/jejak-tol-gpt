# JejakTol measurement

Container GTM-5DMPHWB2 loads the existing Google tag for G-YVM1Z7BV1F.
The app queues standard gtag event commands on the same dataLayer, with explicit send_to.
It does not initialize another Google tag or send additional page_view events.
Do not add GTM Custom Event tags for these commands: they are forwarded by the existing Google tag.

Events: toll_search_start, toll_search_success (including empty results), toll_search_partial,
toll_search_failed, toll_search_cancelled, toll_search_retry, toll_pdf_download,
toll_csv_download, toll_excel_download, toll_download_failed.
Downloads mean file generation and browser download initiation, not proof of a saved file.
Only fixed names and destination are sent: no card, date range, route, amount, receipt or error text.
Existing Google tag consent handling applies. Blocking analytics must not block app actions.
