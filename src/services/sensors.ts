import type { Geography } from "../data/geography";
import type { Scenario, SensorResponse, Station } from "../domain/types";
const defaults = {
  pm25: 18.4,
  humidity: 64,
  windSpeed: 1.8,
  windDirection: 225,
  pressure: 951.2,
};
export function mockSensors(
  geo: Geography,
  scenario: Scenario,
  now = Date.now(),
): SensorResponse {
  const stations: Station[] = geo.subdistricts.features.flatMap(
    (area, index) => {
      const villages = geo.villages.features.filter(
        (v) => String(v.properties.TB_IDN) === area.properties.Admin_code,
      );
      return villages.slice(0, index === 0 ? 2 : 1).map((v, i) => ({
        id: `DEMO-${area.properties.Admin_code}-${i + 1}`,
        name: `สถานีสาธิต ${area.properties.T_Name_T.replace("ตำบล", "")} ${i + 1}`,
        coordinates: v.geometry.coordinates.slice(0, 2) as [number, number],
        area: {
          provinceId: "58" as const,
          districtId: "5803" as const,
          subdistrictId: area.properties.Admin_code,
          villageId: String(v.properties.VILL_IDN),
        },
        measurements: {
          ...defaults,
          pm25: [18.4, 36.2, 68.5, 21.6, 29.8, 16.2, 55.7][index],
          humidity: index === 2 ? 28 : 64,
          windSpeed: index === 4 ? 4.8 : 1.8,
        },
        timestamp: new Date(now - 120000).toISOString(),
        deviceStatus: "online" as const,
        demo: true,
        coordinateSource:
          "GISTDA village reference point; demonstration placement only, not an installed station",
      }));
    },
  );
  for (const s of stations) {
    if (scenario !== "normal") s.measurements = { ...defaults };
    if (scenario === "amber") s.measurements.pm25 = 36.2;
    if (scenario === "red") {
      s.measurements.pm25 = 68.5;
      s.measurements.humidity = 28;
      s.measurements.windSpeed = 7.5;
    }
    if (scenario === "stale")
      s.timestamp = new Date(now - 3600000).toISOString();
    if (scenario === "missing") s.measurements.pm25 = null;
    if (scenario === "invalid") s.measurements.humidity = 120;
    if (scenario === "offline") s.deviceStatus = "offline";
  }
  return {
    schemaVersion: "1.0",
    generatedAt: new Date(now).toISOString(),
    stations: scenario === "empty" ? [] : stations,
  };
}
export function parseSensorResponse(value: unknown): SensorResponse {
  if (!value || typeof value !== "object")
    throw new Error("รูปแบบข้อมูลสถานีไม่ถูกต้อง");
  const data = value as SensorResponse;
  if (
    data.schemaVersion !== "1.0" ||
    !Number.isFinite(Date.parse(data.generatedAt)) ||
    !Array.isArray(data.stations)
  )
    throw new Error("รูปแบบข้อมูลสถานีไม่ถูกต้อง");
  const ids = new Set<string>();
  for (const s of data.stations) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id ||
      ids.has(s.id) ||
      typeof s.name !== "string" ||
      !s.name ||
      !Array.isArray(s.coordinates) ||
      s.coordinates.length !== 2 ||
      !s.coordinates.every(Number.isFinite) ||
      Math.abs(s.coordinates[0]) > 180 ||
      Math.abs(s.coordinates[1]) > 90 ||
      s.area?.districtId !== "5803" ||
      s.area?.provinceId !== "58" ||
      typeof s.area.subdistrictId !== "string" ||
      !/^58030[1-7]$/.test(s.area.subdistrictId) ||
      (s.area.villageId !== null && typeof s.area.villageId !== "string") ||
      (typeof s.area.villageId === "string" &&
        (!/^58030[1-7][0-9]{2}$/.test(s.area.villageId) ||
          !s.area.villageId.startsWith(s.area.subdistrictId))) ||
      typeof s.timestamp !== "string" ||
      !s.measurements ||
      typeof s.measurements !== "object" ||
      Array.isArray(s.measurements) ||
      !["online", "offline", "maintenance"].includes(s.deviceStatus) ||
      typeof s.demo !== "boolean" ||
      typeof s.coordinateSource !== "string"
    )
      throw new Error("ข้อมูลระบุตัวสถานีหรือพิกัดไม่ถูกต้อง");
    ids.add(s.id);
    // Preserve invalid/missing measurements for cautious assessment and explicit presentation.
  }
  return data;
}
export const apiUrl = import.meta.env.VITE_SENSOR_API_URL as string | undefined;
export async function getSensors(
  geo: Geography,
  scenario: Scenario,
  signal?: AbortSignal,
): Promise<SensorResponse> {
  if (!apiUrl) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (scenario === "error") throw new Error("เชื่อมต่อบริการข้อมูลไม่สำเร็จ");
    return mockSensors(geo, scenario);
  }
  const timeout = AbortSignal.timeout(12000);
  const response = await fetch(apiUrl, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(`เชื่อมต่อบริการข้อมูลไม่สำเร็จ (${response.status})`);
  return parseSensorResponse(await response.json());
}
