import { describe, expect, it } from "vitest";
import { parseSensorResponse } from "./sensors";
const valid = {
  schemaVersion: "1.0",
  generatedAt: "2026-09-12T08:00:00Z",
  stations: [
    {
      id: "ONE",
      name: "ทดสอบ",
      coordinates: [98.4, 19.3],
      area: {
        provinceId: "58",
        districtId: "5803",
        subdistrictId: "580301",
        villageId: null,
      },
      measurements: {
        pm25: 18,
        humidity: 60,
        windSpeed: 2,
        windDirection: 0,
        pressure: 950,
      },
      timestamp: "2026-09-12T08:00:00Z",
      deviceStatus: "online",
      demo: true,
      coordinateSource: "test",
    },
  ],
};
describe("sensor API contract", () => {
  it("rejects inconsistent village/subdistrict assignments", () =>
    expect(() =>
      parseSensorResponse({
        ...valid,
        stations: [
          {
            ...valid.stations[0],
            area: { ...valid.stations[0].area, villageId: "58030201" },
          },
        ],
      }),
    ).toThrow());
  it("accepts expected envelope", () =>
    expect(parseSensorResponse(valid).stations).toHaveLength(1));
  it("accepts explicit empty data", () =>
    expect(parseSensorResponse({ ...valid, stations: [] }).stations).toEqual(
      [],
    ));
  it.each([null, {}, [], { schemaVersion: "2.0", stations: [] }])(
    "rejects malformed envelope",
    (value) => expect(() => parseSensorResponse(value)).toThrow(),
  );
  it("rejects invalid geographic coordinates", () =>
    expect(() =>
      parseSensorResponse({
        ...valid,
        stations: [{ ...valid.stations[0], coordinates: [200, 19] }],
      }),
    ).toThrow());
  it("rejects duplicate identifiers", () =>
    expect(() =>
      parseSensorResponse({
        ...valid,
        stations: [...valid.stations, ...valid.stations],
      }),
    ).toThrow());
  it("rejects devices outside Pai", () =>
    expect(() =>
      parseSensorResponse({
        ...valid,
        stations: [
          {
            ...valid.stations[0],
            area: { ...valid.stations[0].area, districtId: "5801" },
          },
        ],
      }),
    ).toThrow());
  it("preserves bad values for explicit warning, never substitutes healthy values", () => {
    const data = parseSensorResponse({
      ...valid,
      stations: [
        {
          ...valid.stations[0],
          measurements: {
            ...valid.stations[0].measurements,
            humidity: 120,
            pm25: null,
          },
        },
      ],
    });
    expect(data.stations[0].measurements).toMatchObject({
      humidity: 120,
      pm25: null,
    });
  });
});
