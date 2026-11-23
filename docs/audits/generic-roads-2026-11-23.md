# Generic road geometry matching — 2026-11-23

Added a conservative resolver for the observed labels Jalan Tol Lingkar Luar (JORR only) and Jalan Tol Pelabuhan (JORR or integrated Dalam Kota). A label resolves only when its named interval has an aligned, unambiguous published-geometry run of at least 60m and every sampled segment stays within 15m of that same system. Gaps, parallel roads and ambiguous overlaps reject the mapping. Repeated or unnamed guidance does not shorten the active named interval.

Existing toll-gap merging keeps its original 1.5km limit. Only classification of a named interval permits longer continuous geometry. No global ambiguous aliases or new fare constants were added.

116 tests passed, including an end-to-end tripSummary test using an actual BIG JORR mainline sample and a diverted-route negative test. Build passed. Runtime commit 1c2c922 deployed READY as dpl_FMByY45QtnzEMctNrBLgBm4txAYb.

Live post-deploy result: Srijaya–Pasar Susun remains Rp43,000. Srijaya–PIK Avenue still has unresolved Lingkar Luar/Pelabuhan intervals; the strict matcher did not resolve these. The retained response is generic-roads-pik-2026-11-23.json. A captured TomTom geometry for that exact route and comparison with newer official mainline/access geometry is still required to identify the failing intervals. Do not report this route or national coverage as complete. Actual card payments and UI appearance were not checked.
