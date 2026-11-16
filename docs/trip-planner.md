# Trip planner and toll network

## Request boundary
POST /api/trip accepts `action: places` with a 3–200 character query, or `action: route` with numeric origin/destination lat/lon in Indonesia. Passenger cars (Golongan I) only. Set `tomtom_api_key` or `TOMTOM_API_KEY` on Vercel, never in the browser. POST requests and private/no-store responses keep addresses out of URL logs. Addresses are not saved to history or analytics.

## Pricing foundation
`lib/toll-network.mjs` defines payment systems independently of route instructions. Aliases are exact after punctuation normalization; JORR 2 and Cinere–Jagorawi are not aliases for JORR/Jagorawi. BPJT prices are fetched for each calculation. Each component returns its system ID, method, fare, source, optional gate pair, and reason when unknown.

- Open: Jagorawi, Depok–Antasari, Pondok Aren–Serpong, Sedyatmo, Semarang ABC.
- Integrated open: JORR 1. Adjacent aliases are billed once per continuous traversal, not once per road name. Returning after another system is not globally deduplicated.
- Closed: mapped directed pairs and adjacent concession boundaries along the Trans-Java corridor; see the current coverage below.

Closed-system pricing requires both boundaries to match either unique known gate locations or an explicitly mapped adjacent concession. A gate must lie within 60 m of the route geometry, and within 2 km along the route of the tolled-section boundary. Ambiguous matches, unknown connectors, and unavailable directed tariff pairs return unknown. Never infer the reverse-direction fare for directed closed-system pairs. Reviewed open-zone rules can apply in both directions, as documented below. Conflicting reverse prices, duplicates, and negative fares are rejected. Only directly adjacent named systems may use a logical connection; unknown intermediate roads are never skipped. Logical boundaries use the UI labels “Awal ruas” and “Akhir ruas”, not physical payment gates.

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
This is not complete Indonesian network coverage. Jakarta–Cikampek zone pricing, Cijago, unregistered corridors and some entry/exit pairs remain outside verified coverage. Kanci–Pejagan reverse rows are absent from the current BPJT feed; those journeys remain incomplete. These include remaining implementation/mapping scope as well as source-data gaps, not solely external data blockers. No inferred flat fare from a single CSV row on an unverified road. No maximum fare substituted for a missing gate pair. No static price used when BPJT cannot be loaded.

TomTom calls: one per location search, one per route. The per-instance 12-request/minute limit is not a global spending cap. Provider quotas are shared by site visitors. Fare retrieval time is not its effective date; check operator notices before travel.

## Earlier coverage update (2026-11-08)
Added Sedyatmo open-system pricing using the BPJT row, and closed-system gate pairs on Cipali (Kalijati, Subang, Cikedung, Kertajati, Sumberjaya) and Pejagan–Pemalang (Brebes Barat, Brebes Timur). Thirteen of the 33 imported gates are enabled. This does not enable entire Trans-Java through journeys: connecting-system boundaries remain unknown. Gate coordinates come from the JSB public calculator; tariffs continue to come from BPJT.

Every priced/mapped component links to the tariff source and the applicable payment-rule or gate-coordinate source. `tariffFetchedAt` is set only after successful download and CSV validation. The UI formats it as yyyy-MM-dd HH:mm:ss WIB, explicitly distinct from the fare effective date (not available in this CSV; refer to the official source). Source failure produces no retrieval timestamp. Source links are HTTPS and restricted to official domains. No scheduled tariff-update service is implied: pricing fetches on each route calculation.

## Earlier connection update (2026-11-08)

Thirteen explicit, bidirectional logical connections now cover Cikampek/Cikopo, Palimanan, Kanci, Pejagan, Pemalang/Sewaka, Pasekaran, Kalikangkung/Krapyak, Banyumanik, Kartasura, Klitik, Kertosono/Batas Barat, Mojokerto, and Grati. Prices still require an exact directed BPJT row. Mapping a connection does not assert that every journey through it is priced. Jakarta–Cikampek zone endpoints and Surabaya–Mojokerto/Gempol mixed payment sections deliberately do not receive guessed through fares.

Additional physical gate mappings: Plumbon 1/2, Ciperna Timur/Barat, Ciledug 1/2, Pemalang (SS Pemalang), Pekalongan (SS Pekalongan), and Batang (SS Batang). Preserve operator gate names for display and separate BPJT tariff names for matching. `Kalikangkung` and the two BPJT spellings `Semarang/Kalikangkung` / `Semarang/Kali Kangkung` share one tariff key.

Sources for the connection review:
- Operator network: https://www.jmtransjawatol.co.id/id/layanan/jalan-tol/jaringan-jalan-tol-jtt
- Palikanci connections: https://www.jmtransjawatol.co.id/id/tentang-kami/profil/lini-bisnis-jtt/ruas-tol-palimanan-kanci?category_id=4&id=27
- Palimanan–Kanci–Pejagan–Pemalang integration: https://binamarga.pu.go.id/index.php/berita/presiden-resmikan-pengoperasian-tol-pejagan-pemalang-dan-integrasi-sistem-transaksi-tol
- Kertosono–Mojokerto western boundary: https://binamarga.pu.go.id/balai-jateng-diy/berita/akhir-tahun-244-kilometer-jalan-tol-trans-jawa-beroperasi-ini-rinciannya
- Serbaraja zones: https://serbaraja.sinarmasland.com/info-layanan/tariff

At this stage Serbaraja was recognized by name but remained unpriced pending zone geometry. The 2026-11-16 update below supersedes that limitation.

Earlier geometry request (now fulfilled): user agreed to register at https://sigi.pu.go.id/geoapi/ for **Gerbang Tol** and **Simpang Susun Tol**. Prefer GeoJSON or SHP including its CRS, identifiers, coordinates, road/gate names, and dataset date. Inspect the exported schema before writing an importer. Never reinterpret projected coordinates as latitude/longitude, auto-enable a fuzzy name match, or advertise full Trans-Java coverage merely because the road names are registered.

Tests cover a six-system Subang–Weleri synthetic path, both directions with explicit rows, east-Java intermediate concessions, unknown connections, missing directions, source inconsistencies, and Kalikangkung spellings. Synthetic tests are not substitutes for live named-place routes.

## PU GeoJSON integration (2026-11-16)

User-provided exports contain 658 gate points and 1,338 interchange features (both LineString and MultiLineString). The importer validates CRS, numeric Indonesian coordinates, geometry types and unique source identifiers before writing. Exact `Operasi` status is eligible by default; four individually reviewed Serbaraja gate overrides are described below. It retains SHA-256 input fingerprints, import time and counts; the import timestamp does not assert source freshness.

Run `node scripts/import-pu-toll-data.mjs '<gate GeoJSON>' '<interchange GeoJSON>'`. It fetches BPJT rows for exact reviewed name matching. Current output has 91 tariff-matched gate points and 277 operating interchange features on recognized systems. Unmatched gates are recorded in the artifact, not silently enabled. Original exports remain untouched. No personal source metadata is retained.

Gate matching combines these points with existing operator coordinates. Multiple lanes can share an explicitly mapped tariff name; different tariff boundaries remain ambiguous. PU ramps can supplement missing road-name guidance only when at least two route samples show 60 metres of aligned overlap within 15 metres. They cannot establish all intervening mainline concessions. Unknown connections continue to block a complete total.

Serbaraja gates in the original export are marked Konstruksi. The reviewed overrides below enable only the four gates confirmed by the operator’s operating-zone announcement; GT Industri remains excluded. Importing a nationwide gate file alone is not proof of full journey coverage.

### Mainline supplement and production checks

`node scripts/update-toll-mainlines.mjs` retrieves public PU geometry hosted by BIG:
https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SARANA_PRASARANA/MapServer/14
The snapshot contains 68 operating features across 22 recognized systems, with source year **2022**. It supplies geometry only, never tariffs. The query requests WGS84 and at most approximately 2 m simplification, rejects truncated/error responses and invalid coordinates, and records retrieval time. UI source links explicitly label the map year.

A spatial grid selects nearby segments. A road event needs 60 m of aligned overlap within 15 m; a competing system within 3 m of the best match is ambiguous. Adjacent duplicate carriageways collapse into one event; actual A–B–A traversals remain distinct. Geometry takes precedence over stale turn-instruction names for systems it identifies. Unrecognized instruction names remain in the calculation and block completeness.

Production checks after commit 2443d03:
- Alun Alun Kabupaten Subang (Jalan RA Wangsa Ghofarana) to Stasiun Weleri: 328,500, six priced concessions.
- Weleri to Subang: reverse Kanci–Pejagan row unavailable; no complete total.
- Weleri to Tunjungan Plaza: six known charges total 487,000; Surabaya–Mojokerto final exit still unknown, so total remains null.
- GT Madiun to GT Caruban: 10,000 (gate-coordinate check, not a named-place test).
- Cibubur Junction to Gramedia Botani: 7,500.

These earlier checks predate the payment-rule fixes below and do not establish full nationwide coverage.


## Payment-rule fixes and production verification (2026-11-16)

- Serbaraja: two reviewed zones, Serpong–SS CBD and SS CBD–SS Legok. Both directions use the operator-confirmed zone rule; prices still come from BPJT. Exact source IDs 62–65 (GT Legok and CBD 1/2/3) have a recorded status override in `data/pu-status-overrides.json`; identity changes fail the import. GT Industri is not enabled.
- Surabaya–Mojokerto: combine the Waru–WRR open component with the exact WRR–Mojokerto closed pair when the route actually crosses Warugunung. A logical Waru endpoint must match the official mainline within 30 m and be within 1 km of its eastern endpoint. Physical gate tolerance remains 60 m. Closed-only trips do not receive the extra open charge.
- Surabaya–Gempol: separate Dupak–Waru open zone, directed Waru–Porong closed pricing, and the southern open zones. Do not sum intermediate closed-pair fares when a direct pair applies.
- Serpong–Cinere: directed Golongan I pricing and reviewed Serpong/Cinere connections. Normalize WRR and Kalikangkung tariff aliases without merging Waru's separate open boundary. JORR W2 Utara/Selatan and Boyolali–Kartosuro guidance aliases resolve to their mapped systems.
- Route geometry rejects reversed section boundaries, nonnumeric/nonfinite points and coordinates outside Indonesia. Unknown pairs still return no complete total. Temporary route-geometry diagnostics were removed from the API.

Additional primary sources:
- Serbaraja operating zones, effective 2024-11-03, explicitly both directions: https://www.bsdcity.com/news-events/mulai-3-november-diberlakukan-tarif-baru-tol-serbaraja/
- Current operator tariff tables, including SUMO and Serpong–Cinere: https://investor.jasamarga.com/newsroom/PT_Jasa_Marga_(Persero)_Tbk_30_September_2026_(1).pdf
- Dupak–Waru open-system classification (historical classification only; current prices use BPJT): https://investor.jasamarga.com/newsroom/628574-JasaMargaTbk_Billingual_30Sep2016.pdf

Production checks on deployed commit `7497e2f`, 2026-11-16:

| Named-place route | Complete toll total (Golongan I) |
| --- | ---: |
| Stasiun Weleri to Chipmunks Indonesia Tunjungan Plaza 5 | Rp530,500 |
| Tunjungan Plaza area to Stasiun Weleri | Rp536,500 |
| AEON BSD City to Treasury Office Tower | Rp47,500 |
| Treasury Office Tower to AEON BSD City | Rp32,500 |

Directions take different traffic-dependent routes; unequal totals are expected. These are observed calculations, not guaranteed future prices/routes. The Weleri journey was exercised through the actual place-selection UI, including a 390 px mobile viewport. Desktop 1366 px and mobile source links wrap without horizontal overflow; ID/EN rendering checked, with no browser console errors/warnings. No raw route trace returned even when the former diagnostic header was supplied.

Validation: 71 automated tests pass and production build passes. No physical drive or every national origin/destination pair was checked. Unmapped corridors and unavailable/inconsistent tariff pairs remain explicit limitations, not zero-cost roads.
