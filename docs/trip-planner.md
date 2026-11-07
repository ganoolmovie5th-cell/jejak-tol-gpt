# Trip planner

POST /api/trip accepts `action: places` with a 3–200 character `query`, or `action: route` with selected numeric `origin` and `destination` lat/lon in Indonesia. Uses TomTom Search and Routing, passenger cars only. Set `tomtom_api_key` (or `TOMTOM_API_KEY`) on Vercel; never expose it in the browser. Location requests use POST and private/no-store responses; addresses are not saved or sent to analytics.

TomTom tollRoad sections and instruction street names identify portions of the route; they are not individual payment gates. Do not infer gate names from signposts, or sum BPJT rows by fuzzy road-name matching. Current automatic pricing only covers an unambiguous continuous Jagorawi-only section using the BPJT tariff row. All other sections are explicitly unpriced, and any unpriced section prevents a complete total. This is not yet a nationwide automatic toll-cost calculator.

Jagorawi open-system reference: https://investor.jasamarga.com/misc/AR/html/2024/963/ and Jasa Marga 2024 annual report. Tariff source is the existing public BPJT CSV; retrieved prices may lag effective rates. Extend coverage only after validating gate coordinates, billing-system boundaries, aliases, and direction against operator examples. Never charge integrated systems once per road name.

Each location search makes one TomTom request; route calculation makes one Routing request. The per-instance 12-request/minute limit reduces accidental repeats, but is not a global quota or spending cap. Set account-side limits and monitor provider usage; the free allowance is shared by site visitors.
