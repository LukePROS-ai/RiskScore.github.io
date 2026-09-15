# Mae Hong Son display boundary

`province.geojson` contains all seven district polygons with `P_code='58'`
from GISTDA's administrative boundaries service, layer 3 (DOPA, 2013).
The map uses their combined extent to restrict panning and their outer rings
to mask areas outside Mae Hong Son. Assessment coverage remains Pai District.
These historical boundaries are not a current legal boundary certification.

Source: https://gistdaportal.gistda.or.th/arcgis/rest/services/ข้อมูลเขตการปกครอง/MapServer/3

Refresh only this dataset: `node scripts/fetch-geography.mjs --province-only`.
