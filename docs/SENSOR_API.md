# Sensor API v1.0

`GET <VITE_SENSOR_API_URL>` returns `200 application/json` with the latest observations for each device. Do not return predicted values here. The adapter is `src/services/sensors.ts`; shared TypeScript types are in `src/domain/types.ts`. Polling is once per minute; request timeout is 12 seconds.

```json
{
  "schemaVersion": "1.0",
  "generatedAt": "2026-09-12T08:00:00Z",
  "stations": [
    {
      "id": "DEMO-580301-1",
      "name": "สถานีสาธิต เวียงใต้ 1",
      "coordinates": [98.441633, 19.39702],
      "area": {
        "provinceId": "58",
        "districtId": "5803",
        "subdistrictId": "580301",
        "villageId": null
      },
      "measurements": {
        "pm25": 18.4,
        "humidity": 64,
        "windSpeed": 1.8,
        "windDirection": 225,
        "pressure": 951.2
      },
      "timestamp": "2026-09-12T07:58:00Z",
      "deviceStatus": "online",
      "demo": true,
      "coordinateSource": "Illustrative response only; replace with surveyed station coordinates and confirmed administrative assignment"
    }
  ]
}
```

The example is a contract demonstration, **not an installed station** and not a verified geographic/administrative assignment. Actual development examples instead use the unchanged coordinates and administrative fields from each selected GISTDA village feature.

| Field              | Required meaning                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`    | Literal `1.0`                                                                                                               |
| `generatedAt`      | ISO 8601 UTC response generation time; never a substitute for a device observation timestamp                                |
| `stations`         | Array; empty array means no devices, never synthetic success                                                                |
| `id`, `name`       | Unique stable ID and Thai display name                                                                                      |
| `coordinates`      | WGS84 `[longitude, latitude]`, GeoJSON order                                                                                |
| `area`             | String administrative codes; province `58`, district `5803`, six-digit subdistrict code, eight-digit village code or `null` |
| `pm25`             | Instantaneous concentration, µg/m³, or `null`                                                                               |
| `humidity`         | Relative humidity %, or `null`                                                                                              |
| `windSpeed`        | m/s, or `null`                                                                                                              |
| `windDirection`    | Degrees clockwise from true north, direction wind comes FROM; 0 and 360 mean north; or `null`                               |
| `pressure`         | Station atmospheric pressure in hPa, or `null`                                                                              |
| `timestamp`        | Device observation timestamp, ISO 8601 including UTC offset; never stamp old data with request time                         |
| `deviceStatus`     | `online`, `offline`, or `maintenance`                                                                                       |
| `demo`             | `false` for actual devices; `true` only for explicit test fixtures                                                          |
| `coordinateSource` | Survey/source reference for installed coordinates                                                                           |

Use JSON numbers, not numeric strings. Do not send zero to mean missing. The runtime validates the envelope, identity, coordinates, device status and Pai district membership. Invalid numeric values or observation times are preserved and flagged by the rules module rather than replaced. Malformed envelopes or duplicate IDs cause an error and cautious status. The JSON Schema is the stricter producer contract; the runtime intentionally tolerates individual bad/missing measurement values so the operator can see which reading failed.

The current five measurements are assumed to share one timestamp. If device channels have separate observation times, extend the contract and freshness checks per measurement before integrating; do not label mixed-age channels with the newest timestamp.

Readings are temporarily suppressed while a request is in progress; an error clears the response and shows a retry action. This keeps a previous green recommendation from being shown as the result of a failed or changed request. Browser connectivity is not treated as proof that a device is online; `deviceStatus` and observation age are checked separately.
