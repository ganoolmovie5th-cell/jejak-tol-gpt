# Trip planner and toll network

## Request boundary
POST /api/trip accepts `action: places` with a 3–200 character query, or `action: route` with numeric origin/destination lat/lon in Indonesia. Passenger cars (Golongan I) only. Set `tomtom_api_key` or `TOMTOM_API_KEY` on Vercel, never in the browser. POST requests and private/no-store responses keep addresses out of URL logs. Addresses are not saved to history or analytics.

## Pricing foundation
`lib/toll-network.mjs` defines payment systems independently of route instructions. Aliases are exact after punctuation normalization; JORR 2 and Cinere–Jagorawi are not aliases for JORR/Jagorawi. BPJT prices are fetched for each calculation. Each component returns its system ID, method, fare, source, optional gate pair, and reason when unknown.

- Open: Jagorawi, Depok–Antasari, Pondok Aren–Serpong, Sedyatmo, Semarang ABC.
- Integrated open: JORR 1. Adjacent aliases are billed once per continuous traversal, not once per road name. Returning after another system is not globally deduplicated.
- Closed: mapped directed pairs and adjacent concession boundaries along the Trans-Java corridor; see the current coverage below.

Closed-system pricing requires both boundaries to match either unique known gate locations or an explicitly mapped adjacent concession. A gate must lie within 60 m of the route geometry, and within 2 km along the route of the tolled-section boundary. Ambiguous matches, unknown connectors, and unavailable directed tariff pairs return unknown. Never infer the reverse-direction fare. Conflicting reverse prices, duplicates, and negative fares are rejected. Only directly adjacent named systems may use a logical connection; unknown intermediate roads are never skipped. Logical boundaries use the UI labels “Awal ruas” and “Akhir ruas”, not physical payment gates.

TomTom guidance gives the road *after* a maneuver. Exit context persists through final ramp turns until another motorway entrance. Explicit toll transfers remain included. This prevents Pajajaran at the end of Jagorawi from being priced as another toll.

Unknown components stay unknown; the response total is null unless every component is priced. `knownSubtotal` excludes unknowns and is labeled **not the trip total**. A route without toll sections returns zero.

## Data maintenance and provenance
Run `node scripts/update-toll-gates.mjs` to refresh operator coordinates. Parsing and geographic bounds are validated before replacing the file. The imported catalogue includes 33 gates; 22 with reviewed tariff names are enabled. The remaining coordinates are staged data, not claimed coverage. Review coordinate and name changes in git before deployment.

Tariff source: https://bpjt.pu.go.id/info-tarif-dan-golongan/ (existing CSV parser).
Payment rules:
- Jagorawi: https://investor.jasamarga.com/misc/AR/html/2024/963/
- Depok–Antasari: https://bpjt.pu.go.id/cukup-satu-kali-tapping-mulai-hari-ini-bayar-tol-depok-antasari-seksi-andara-sawangan-berlakukan-sistem-terbuka/
- BSD, including 9,500 + 17,000 JORR integration: https://bsdtol.com/tarif
- JORR integrated systems: https://investor-id.jasamarga.com/newsroom/LK_JSMR_31_Desember_2025.pdf
- JSB gate coordinates: https://www.jsb.co.id/calculator

## Limits
This is not complete Indonesian network coverage. Serbaraja zone identification, Serpong–Cinere, Cijago, most eastern entry/exit gate coordinates, and mixed open/closed Surabaya connections still need verified gate/junction data. No inferred flat fare from a single CSV row on an unverified road. No maximum fare substituted for a missing gate pair. No static price used when BPJT cannot be loaded.

TomTom calls: one per location search, one per route. The per-instance 12-request/minute limit is not a global spending cap. Provider quotas are shared by site visitors. Fare retrieval time is not its effective date; check operator notices before travel.

## Earlier coverage update (2026-11-08)
Added Sedyatmo open-system pricing using the BPJT row, and closed-system gate pairs on Cipali (Kalijati, Subang, Cikedung, Kertajati, Sumberjaya) and Pejagan–Pemalang (Brebes Barat, Brebes Timur). Thirteen of the 33 imported gates are enabled. This does not enable entire Trans-Java through journeys: connecting-system boundaries remain unknown. Gate coordinates come from the JSB public calculator; tariffs continue to come from BPJT.

Every priced/mapped component links to the tariff source and the applicable payment-rule or gate-coordinate source. `tariffFetchedAt` is set only after successful download and CSV validation. The UI formats it as yyyy-MM-dd HH:mm:ss WIB, explicitly distinct from the fare effective date (not available in this CSV; refer to the official source). Source failure produces no retrieval timestamp. Source links are HTTPS and restricted to official domains. No scheduled tariff-update service is implied: pricing fetches on each route calculation.

## Current connection update (2026-11-08)

Thirteen explicit, bidirectional logical connections now cover Cikampek/Cikopo, Palimanan, Kanci, Pejagan, Pemalang/Sewaka, Pasekaran, Kalikangkung/Krapyak, Banyumanik, Kartasura, Klitik, Kertosono/Batas Barat, Mojokerto, and Grati. Prices still require an exact directed BPJT row. Mapping a connection does not assert that every journey through it is priced. Jakarta–Cikampek zone endpoints and Surabaya–Mojokerto/Gempol mixed payment sections deliberately do not receive guessed through fares.

Additional physical gate mappings: Plumbon 1/2, Ciperna Timur/Barat, Ciledug 1/2, Pemalang (SS Pemalang), Pekalongan (SS Pekalongan), and Batang (SS Batang). Preserve operator gate names for display and separate BPJT tariff names for matching. `Kalikangkung` and the two BPJT spellings `Semarang/Kalikangkung` / `Semarang/Kali Kangkung` share one tariff key.

Sources for the connection review:
- Operator network: https://www.jmtransjawatol.co.id/id/layanan/jalan-tol/jaringan-jalan-tol-jtt
- Palikanci connections: https://www.jmtransjawatol.co.id/id/tentang-kami/profil/lini-bisnis-jtt/ruas-tol-palimanan-kanci?category_id=4&id=27
- Palimanan–Kanci–Pejagan–Pemalang integration: https://binamarga.pu.go.id/index.php/berita/presiden-resmikan-pengoperasian-tol-pejagan-pemalang-dan-integrasi-sistem-transaksi-tol
- Kertosono–Mojokerto western boundary: https://binamarga.pu.go.id/balai-jateng-diy/berita/akhir-tahun-244-kilometer-jalan-tol-trans-jawa-beroperasi-ini-rinciannya
- Serbaraja zones: https://serbaraja.sinarmasland.com/info-layanan/tariff

Serbaraja is recognized by name, but a route name alone cannot select its 6,000/7,000 zones or establish whether both were traversed. It remains unpriced until the relevant boundary geometry is reviewed.

Pending authoritative geometry: user agreed to register at https://sigi.pu.go.id/geoapi/ for **Gerbang Tol** and **Simpang Susun Tol**. Prefer GeoJSON or SHP including its CRS, identifiers, coordinates, road/gate names, and dataset date. Inspect the exported schema before writing an importer. Never reinterpret projected coordinates as latitude/longitude, auto-enable a fuzzy name match, or advertise full Trans-Java coverage merely because the road names are registered.

Tests cover a six-system Subang–Weleri synthetic path, both directions with explicit rows, east-Java intermediate concessions, unknown connections, missing directions, source inconsistencies, and Kalikangkung spellings. Synthetic tests are not substitutes for live named-place routes.
