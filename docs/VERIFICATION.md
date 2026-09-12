# Verification record

Verified locally on 12 September 2026, Node 24.16.0, Windows, browser served at `http://127.0.0.1:5173`.

## Automated checks

- `npm run typecheck`: passed (strict TypeScript).
- `npm run lint`: passed (TypeScript ESLint and React Hooks rules).
- `npm test`: 40 passing tests across two suites.
- `npm run build`: production TypeScript compilation and Vite bundle passed.
- `npm audit`: no known vulnerabilities after updating Vitest to 4.1.11.
- Repository inspection: initially empty apart from `.git`; no previous application or API specification; no unrelated user files replaced.

Tests cover all three recommendation statuses; inclusive/exclusive thresholds; simultaneous risk factors; each missing channel; NaN, Infinity and implausible values; zero readings; 15-minute freshness boundary; future/invalid timestamps; offline and maintenance states; worst-case station aggregation; provisional flag; FROM-to-TO wind bearings with wrap-around; malformed API envelopes, coordinates, duplicate station IDs, Pai administrative assignment and preservation of missing/invalid values.

## Browser checks

- Desktop viewport 1440 × 1000: rendered map, Thai layout, panel and measurement cards inspected.
- Mobile viewport 390 × 844: map and dashboard inspected; native bottom drawer opens, searching for ทุ่ง filters subdistricts, selecting ทุ่งยาว filters villages, selecting its station updates the map and green assessment, drawer closes.
- Narrow mobile 320 × 780: no horizontal document overflow; headings wrap; map remains usable. Unique form IDs were verified in rendered DOM.
- Subdistrict panel selection updates the area title, polygon styling and map extent; ทุ่งยาว exposes two station options.
- Selecting the บ้านแพมบก marker synchronizes the village selector and shows the cautious no-station state; reset returns the district overview.
- Keyboard Enter on the แม่ฮี้ polygon updates the subdistrict selector; selecting its station marker updates village, station and dashboard together.
- Desktop selection panel collapse/expand works.
- The development scenario selector demonstrated `เผาได้`, `ไม่แนะนำ`, `ไม่ควรเผา`, and stale, missing, invalid, device-offline, empty and service-error cases. Every failure case rendered `ไม่ควรเผา`.
- No application console errors/warnings were observed in the browser scenario checks.
- Background tiles loaded from OpenStreetMap; packaged GeoJSON boundaries and village markers are independent of the tile service.

## Limits of this verification

No actual sensor hardware or live API was supplied, so field integration, calibration, per-device timestamps, real service authentication/CORS and operational accuracy remain unverified. Browser network disconnection and terrain-service outages were not artificially injected; the device-offline and service-error fixtures were exercised. This is not a full WCAG audit or an assessment of regulatory suitability. Historic government geographic records and incomplete village coverage require local endorsement before use in real decisions. No public deployment was performed.
