# Trip planner and toll network

## Request boundary
POST /api/trip accepts `action: places` with a 3–200 character query, or `action: route` with numeric origin/destination lat/lon in Indonesia. Passenger cars (Golongan I) only. Set `tomtom_api_key` or `TOMTOM_API_KEY` on Vercel, never in the browser. POST requests and private/no-store responses keep addresses out of URL logs. Addresses are not saved to history or analytics.

## Pricing foundation
`lib/toll-network.mjs` defines payment systems independently of route instructions. Aliases are exact after punctuation normalization; JORR 2 and Cinere–Jagorawi are not aliases for JORR/Jagorawi. BPJT prices are fetched for each calculation. Each component returns its system ID, method, fare, source, optional gate pair, and reason when unknown.

- Open: Jagorawi, Depok–Antasari, Pondok Aren–Serpong.
- Integrated open: JORR 1. Adjacent aliases are billed once per continuous traversal, not once per road name. Returning after another system is not globally deduplicated.
- Closed: Semarang–Batang, restricted to the six enabled operator gates in `data/toll-gates.json`.

Closed-system pricing requires both boundaries to match unique known gate locations. A gate must lie within 60 m of the route geometry, and within 2 km along the route of the tolled-section boundary. Ambiguous matches, unknown connectors, and unavailable directed tariff pairs return unknown. Never infer the reverse-direction fare. Multiple systems in a single closed section require reviewed connecting-junction data; they are not priced yet.

TomTom guidance gives the road *after* a maneuver. Exit context persists through final ramp turns until another motorway entrance. Explicit toll transfers remain included. This prevents Pajajaran at the end of Jagorawi from being priced as another toll.

Unknown components stay unknown; the response total is null unless every component is priced. `knownSubtotal` excludes unknowns and is labeled **not the trip total**. A route without toll sections returns zero.

## Data maintenance and provenance
Run `node scripts/update-toll-gates.mjs` to refresh operator coordinates. Parsing and geographic bounds are validated before replacing the file. The imported catalogue includes 33 gates; only six belonging to JSB are enabled. The remaining coordinates are staged data, not claimed coverage. Review coordinate and name changes in git before deployment.

Tariff source: https://bpjt.pu.go.id/info-tarif-dan-golongan/ (existing CSV parser).
Payment rules:
- Jagorawi: https://investor.jasamarga.com/misc/AR/html/2024/963/
- Depok–Antasari: https://bpjt.pu.go.id/cukup-satu-kali-tapping-mulai-hari-ini-bayar-tol-depok-antasari-seksi-andara-sawangan-berlakukan-sistem-terbuka/
- BSD, including 9,500 + 17,000 JORR integration: https://bsdtol.com/tarif
- JORR integrated systems: https://investor-id.jasamarga.com/newsroom/LK_JSMR_31_Desember_2025.pdf
- JSB gate coordinates: https://www.jsb.co.id/calculator

## Limits
This is not complete Indonesian network coverage. Serbaraja, Serpong–Cinere, Cijago, and cross-operator Trans-Java boundary mappings still need verified gate/junction data. No inferred flat fare from a single CSV row on an unverified road. No maximum fare substituted for a missing gate pair. No static price used when BPJT cannot be loaded.

TomTom calls: one per location search, one per route. The per-instance 12-request/minute limit is not a global spending cap. Provider quotas are shared by site visitors. Fare retrieval time is not its effective date; check operator notices before travel.

## Coverage update (2026-11-08)
Added Sedyatmo open-system pricing using the BPJT row, and closed-system gate pairs on Cipali (Kalijati, Subang, Cikedung, Kertajati, Sumberjaya) and Pejagan–Pemalang (Brebes Barat, Brebes Timur). Thirteen of the 33 imported gates are enabled. This does not enable entire Trans-Java through journeys: connecting-system boundaries remain unknown. Gate coordinates come from the JSB public calculator; tariffs continue to come from BPJT.

Every priced/mapped component links to the tariff source and the applicable payment-rule or gate-coordinate source. `tariffFetchedAt` is set only after successful download and CSV validation. The UI formats it as yyyy-MM-dd HH:mm:ss WIB, explicitly distinct from the fare effective date (not available in this CSV; refer to the official source). Source failure produces no retrieval timestamp. Source links are HTTPS and restricted to official domains. No scheduled tariff-update service is implied: pricing fetches on each route calculation.
