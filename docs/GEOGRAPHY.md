# Pai geography: provenance and limitations

Retrieved 12 September 2026. GeoJSON uses WGS84/EPSG:4326 and `[longitude, latitude]` coordinates. Geometry is returned by GISTDA with six-decimal precision; no administrative polygons or village coordinates were drawn or fabricated.

## Government source

[GISTDA administrative map service](https://gistdaportal.gistda.or.th/arcgis/rest/services/%E0%B8%82%E0%B9%89%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B9%80%E0%B8%82%E0%B8%95%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9B%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%AD%E0%B8%87/MapServer) (service item `16bec619a9bc41478ee00cd77cba13be`).

| File                                     | Layer / query                          | Records / vintage                                             |
| ---------------------------------------- | -------------------------------------- | ------------------------------------------------------------- |
| `public/data/district.geojson`           | Layer 3; `P_code='58' AND A_code='03'` | 1 Pai polygon, DOPA `Source_dat` 2013-12-30 UTC               |
| `public/data/subdistricts.geojson`       | Layer 4; same query                    | 7 polygons, DOPA 2013-12-30 UTC                               |
| `public/data/villages.geojson`           | Layer 1; `AP_IDN=5803`                 | 62 point records; `YEAR_=2552` (2009)                         |
| `public/data/village-boundaries.geojson` | No source obtained                     | Empty FeatureCollection, intentionally no invented boundaries |

`npm run geo:refresh` reruns the documented public read-only queries through `scripts/fetch-geography.mjs`. Review changes and provenance before replacing an endorsed dataset. A refresh does not make these historical records current. Downloads are bundled so the app does not depend on GISTDA availability at runtime. The service attributes copyright to GISTDA but exposes no explicit redistribution license in the inspected layer metadata; confirm terms with the agency before public distribution. OSM tiles are attributed to OpenStreetMap contributors; the optional terrain layer is attributed to OpenTopoMap / SRTM.

The seven source subdistricts: 580301 เวียงใต้, 580302 เวียงเหนือ, 580303 แม่นาเติง, 580304 แม่ฮี้, 580305 ทุ่งยาว, 580306 เมืองแปง, 580307 โป่งสา.

## Completeness and discrepancies

[Mae Hong Son PAO's GIS boundary activity](https://home.mhs-pao.go.th/index.php?Itemid=210&catid=55&id=3167:650720-1117&option=com_content&view=article), dated 20 July 2022, describes 66 villages and seven subdistricts in its title. Its narrative lists six participating subdistricts; this report is evidence that the old 62-point layer is incomplete, not a definitive current village registry or downloadable boundary dataset.

There are historical differences between the GISTDA village records and newer local government pages. For example, the GISTDA point labeled บ้านแพมบก has village code 05, whereas a provincial agricultural document lists หมู่ 6; GISTDA contains a บ้านแม่เย็น record assigned to แม่นาเติง, while [Mae Hi SAO](https://www.maeheepai.go.th/content/generalinfo) lists บ้านแม่เย็น as หมู่ 1 in แม่ฮี้. These may represent changed records, source errors or distinct namesakes; they have **not** been silently corrected or assumed equivalent. [Wiang Nuea SAO](https://www.wiangnuepai.go.th/content/generalinfo) lists ten main villages and dependent settlements, illustrating why official villages must be distinguished from hamlets. The app displays historical source records as such, not a verified current gazetteer. Data must be reconciled with local authorities.

## Required handover from the project team

1. Current endorsed Pai register with subdistrict codes, village codes, Thai names and village numbers, including all officially recognized villages and effective dates.
2. Endorsed village polygon boundaries in GeoJSON (or source GIS files with CRS) and accurate village reference points. Provide provenance, update date, license/authorization and clarification of hamlets versus official villages.
3. Actual station IDs/names, surveyed WGS84 coordinates, administrative assignment and coverage extent. The development station coordinates are taken unchanged from historical village points for demonstration; they are not device locations.
4. Approved rules, calibration/quality limits, data freshness limits and relevant policy/permit integration requirements.
5. Surveyed community directions/sectors for a directional smoke rule. No directions are inferred from place names.

When endorsed polygons arrive, populate the separate empty village-boundary GeoJSON with properties `villageId`, `subdistrictId`, `nameTh`, `source`, `effectiveDate`; add a selectable layer mapped to the existing `Selection.villageId`. Village point/selector interaction already works without polygons. Check joins, unique IDs, point-in-polygon placement and complete coverage before declaring the geographic requirement complete.
