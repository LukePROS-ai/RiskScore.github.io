# ปายอากาศดี — Pai agricultural burning decision support

A Thai-first, responsive React / TypeScript / Vite application using Leaflet. The repository was empty (no source, framework, API specification, or existing commits), so no existing application was replaced.

## Run

Requires Node.js 22.12+ (verified with Node 24) and npm.

```sh
npm install
npm run dev
# Open http://127.0.0.1:5173
npm run typecheck
npm run lint
npm test
npm run build
```

The production output is `dist/`, suitable for a static HTTPS host. This task does not configure a public deployment. `npm ci` installs exactly the included lockfile. The preview currently uses port 5173.

## GitHub Pages deployment

The repository includes `.github/workflows/deploy-pages.yml`. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions** once. Every push to `main` then runs tests, builds the app, and deploys `dist/`. Vite uses relative asset paths so both project Pages URLs and account-root Pages URLs work. Do not configure a secret sensor URL in `VITE_SENSOR_API_URL`; browser-visible Vite values are public. Use a public read-only endpoint or a backend proxy.

## Architecture

- `src/App.tsx`: application composition, shared selection and loading lifecycle.
- `src/components/PaiMap.tsx`: Leaflet layers, selectable polygons, village points, station symbols, extent fitting, zoom/pan, basemap fallback message.
- `src/components/AreaPanel.tsx`: searchable subdistrict selection, dependent village/station selectors; same component inside a native mobile dialog with focus containment and Escape support.
- `src/components/Dashboard.tsx`: status, measurement cards, data quality, station provenance, explanations.
- `src/domain/types.ts`: normalized observation/assessment contracts.
- `src/domain/rules.ts`: pure, centralized current-observation assessment logic.
- `src/data/geography.ts` and `public/data/*.geojson`: independently loaded geographic data.
- `src/services/sensors.ts`: development fixtures, response validation, replaceable HTTP adapter.
- `src/domain/rules.test.ts`, `src/services/sensors.test.ts`: threshold, freshness, missing/invalid/offline, worst-case aggregation, and contract tests.

No forecasts, historical time series, ML, or predictive charts are generated. Future forecasting should be a separate service returning a new `ForecastResponse` (with issue time, valid time, method, and uncertainty); do not put forecasts into `Station.measurements` or silently mix predictions with observations. Current assessment is a pure function, so a future forecasting feature need not change the map or observation service contract.

## Safety configuration

Edit **`assessmentRules` in `src/domain/rules.ts`**. The version is `demo-1` and `provisional` is true. PM2.5 25/50 µg/m³, humidity below 45/30%, wind 4/7 m/s, and 15-minute freshness are **demonstration values, not official safety limits**. Boundary inclusivity is explicit in code and tested. These are instantaneous PM2.5 readings, not a regulatory 24-hour mean. Pressure is station pressure, not sea-level corrected.

All five readings are essential in this prototype. Missing values, implausible values, timestamps too far in the future, old observations, and offline/maintenance devices produce `ไม่ควรเผา`. Zero is preserved as a valid value. The most restrictive factor wins; for an area with multiple stations the most restrictive station wins. The displayed measurements come from that determining station, not from an invented average. A village with no assigned station stays unassessed/cautious; the app does not borrow data from a neighboring village. A broader area result only describes reporting stations and does not establish coverage of unsensed land.

Wind direction is meteorological **FROM** degrees clockwise from true north. An optional `communitySectors` rule converts this to **TO** degrees. It is empty until locally surveyed community bearings and sector widths are supplied; the UI explicitly discloses that smoke transport to communities is not yet assessed. This is a directional rule, not dispersion modeling.

Replace thresholds and validation ranges with authorized values, record their authority/version/date, confirm station calibration and coverage, and review translated explanations before operational use. Never interpret the green label as a legal permit; the permanent Thai notice states this explicitly.

## Sensor integration

See [docs/SENSOR_API.md](docs/SENSOR_API.md) for the response contract, units, and JSON example; [docs/sensor-response.schema.json](docs/sensor-response.schema.json) is the machine-readable contract. Copy `.env.example` to `.env.local` and set `VITE_SENSOR_API_URL` to a read-only JSON endpoint to switch off development fixtures. Restart Vite after changing environment variables. The app polls every 60 seconds, checks freshness every 15 seconds, times out requests after 12 seconds, and supports manual refresh.

No endpoint was supplied. Demonstration readings live in the data service. Station coordinates are **copied unchanged from sourced village points for illustration**, not invented geographic coordinates and not actual device installations. Station names and readings are explicitly fictional. The demo selector exercises all three recommendations and stale, missing, invalid, offline, empty, and service-error states. Browser offline status also prevents an affirmative recommendation. A failed live API never falls back to mock readings.

Environment values prefixed `VITE_` are public in the browser build. Put authentication, secrets, vendor credentials, and private-device access behind your own backend proxy; never add them to this client or to the endpoint URL. Prefer a same-origin endpoint or configure restrictive CORS on your API.

## Geography and remaining data

See [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md) for exact source URLs, retrieval queries, dates, completeness limitations, and the data handover checklist. Bundled real source data covers seven subdistrict polygons, one district polygon, and 62 historical village point records. The provincial administration refers to 66 villages. **This is not a complete/current official village registry.** No village polygons were obtained; `public/data/village-boundaries.geojson` is an explicitly empty replacement structure, not synthetic boundaries. The map displays subdistrict boundaries and selectable historical village points. Village selection highlights the point and its source-assigned subdistrict; it does not imply a village polygon exists.

The user still needs to provide a current endorsed village register, missing village points, approved village boundaries, actual device coordinates/assignments, coverage definitions, live API details, authorized thresholds and community bearings.

## Verification

See [docs/VERIFICATION.md](docs/VERIFICATION.md) for checks performed and browser coverage. Local fonts are bundled. OSM/OpenTopoMap background tiles require Internet access; boundaries and village points are bundled and stay usable if tiles fail. Attribution remains visible. No generated time-series charts are shown because there is no historical sensor data source.
