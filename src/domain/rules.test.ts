import { describe, expect, it } from "vitest";
import { assess, assessArea, assessmentRules, compass } from "./rules";
import type { Station } from "./types";
const now = Date.parse("2026-09-12T08:00:00Z");
const base: Station = {
  id: "TEST",
  name: "สถานีทดสอบ",
  coordinates: [98.44, 19.36],
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
    windDirection: 225,
    pressure: 950,
  },
  timestamp: new Date(now).toISOString(),
  deviceStatus: "online",
  demo: true,
  coordinateSource: "test only",
};
describe("central assessment rules", () => {
  it("demonstrates all three states", () => {
    expect(assess(base, now).status).toBe("เผาได้");
    expect(
      assess({ ...base, measurements: { ...base.measurements, pm25: 25 } }, now)
        .status,
    ).toBe("ไม่แนะนำ");
    expect(
      assess({ ...base, measurements: { ...base.measurements, pm25: 50 } }, now)
        .status,
    ).toBe("ไม่ควรเผา");
  });
  it.each([
    ["humidity", 45, "เผาได้"],
    ["humidity", 44.9, "ไม่แนะนำ"],
    ["humidity", 30, "ไม่แนะนำ"],
    ["humidity", 29.9, "ไม่ควรเผา"],
    ["windSpeed", 3.9, "เผาได้"],
    ["windSpeed", 4, "ไม่แนะนำ"],
    ["windSpeed", 7, "ไม่ควรเผา"],
  ])("checks the %s threshold at %s", (key, value, status) =>
    expect(
      assess(
        { ...base, measurements: { ...base.measurements, [key]: value } },
        now,
      ).status,
    ).toBe(status),
  );
  it("uses the most severe factor and includes every reason", () => {
    const a = assess(
      {
        ...base,
        measurements: {
          ...base.measurements,
          pm25: 30,
          humidity: 20,
          windSpeed: 8,
        },
      },
      now,
    );
    expect(a.status).toBe("ไม่ควรเผา");
    expect(a.reasons).toHaveLength(3);
  });
  it("fails cautiously for missing stations", () =>
    expect(assess(undefined, now)).toMatchObject({
      status: "ไม่ควรเผา",
      quality: "missing",
    }));
  it.each(["pm25", "humidity", "windSpeed", "windDirection", "pressure"])(
    "fails cautiously for missing %s",
    (key) =>
      expect(
        assess(
          { ...base, measurements: { ...base.measurements, [key]: null } },
          now,
        ),
      ).toMatchObject({ status: "ไม่ควรเผา", quality: "missing" }),
  );
  it.each([NaN, Infinity, -1, 2001])("rejects invalid PM2.5 %s", (pm25) =>
    expect(
      assess({ ...base, measurements: { ...base.measurements, pm25 } }, now),
    ).toMatchObject({ status: "ไม่ควรเผา", quality: "invalid" }),
  );
  it("treats zero as a real reading", () =>
    expect(
      assess(
        {
          ...base,
          measurements: {
            ...base.measurements,
            pm25: 0,
            windSpeed: 0,
            windDirection: 0,
          },
        },
        now,
      ).status,
    ).toBe("เผาได้"));
  it("expires readings strictly after 15 minutes", () => {
    expect(assess(base, now + 900000).quality).toBe("fresh");
    expect(assess(base, now + 900001)).toMatchObject({
      status: "ไม่ควรเผา",
      quality: "stale",
    });
  });
  it.each(["invalid", "2026-09-12T09:00:00Z"])(
    "rejects invalid/future timestamp %s",
    (timestamp) =>
      expect(assess({ ...base, timestamp }, now).quality).toBe("invalid"),
  );
  it.each(["offline", "maintenance"] as const)(
    "fails cautiously during %s",
    (deviceStatus) =>
      expect(assess({ ...base, deviceStatus }, now)).toMatchObject({
        status: "ไม่ควรเผา",
        quality: "offline",
      }),
  );
  it("aggregates cautiously without averaging away local danger", () =>
    expect(
      assessArea([base, { ...base, timestamp: "2020-01-01T00:00:00Z" }], now)
        .status,
    ).toBe("ไม่ควรเผา"));
  it("has provisional results", () =>
    expect(assess(base, now).provisional).toBe(true));
  it("supports surveyed downwind sectors with wrap-around", () => {
    const rules = {
      ...assessmentRules,
      communitySectors: [
        { stationId: "TEST", bearing: 355, halfWidth: 15, label: "ชุมชนทดสอบ" },
      ],
    };
    expect(
      assess(
        { ...base, measurements: { ...base.measurements, windDirection: 180 } },
        now,
        rules,
      ).status,
    ).toBe("ไม่ควรเผา");
    expect(assess(base, now, rules).status).toBe("เผาได้");
  });
  it("keeps compass direction correct", () => {
    expect(compass(360)).toBe("เหนือ");
    expect(compass(225)).toBe("ตะวันตกเฉียงใต้");
  });
});
