import type { Assessment, Measurements, Station } from "./types";
// DEMONSTRATION ONLY. Replace with locally authorized, versioned thresholds before deployment for operational use.
export const assessmentRules = {
  version: "demo-1",
  provisional: true,
  maxAgeMinutes: 15,
  futureToleranceMinutes: 2,
  pm25: { caution: 25, stop: 50 },
  humidity: { cautionBelow: 45, stopBelow: 30 },
  windSpeed: { caution: 4, stop: 7 },
  // Meteorological wind FROM degrees. Optional surveyed community bearing (wind TO), never inferred from village name.
  communitySectors: [] as {
    stationId: string;
    bearing: number;
    halfWidth: number;
    label: string;
  }[],
};
export const ranges: Record<keyof Measurements, [number, number]> = {
  pm25: [0, 2000],
  humidity: [0, 100],
  windSpeed: [0, 75],
  windDirection: [0, 360],
  pressure: [300, 1100],
};
export function validMeasurement(
  key: keyof Measurements,
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= ranges[key][0] &&
    value <= ranges[key][1]
  );
}
export function assess(
  station?: Station,
  now = Date.now(),
  rules = assessmentRules,
): Assessment {
  const result = (
    status: Assessment["status"],
    reasons: string[],
    quality: Assessment["quality"] = "fresh",
  ): Assessment => ({
    status,
    reasons,
    quality,
    provisional: rules.provisional,
  });
  if (!station)
    return result(
      "ไม่ควรเผา",
      ["ไม่มีข้อมูลสถานีสำหรับพื้นที่นี้ จึงยังประเมินสภาพแวดล้อมไม่ได้"],
      "missing",
    );
  if (station.deviceStatus !== "online")
    return result(
      "ไม่ควรเผา",
      ["สถานีขาดการเชื่อมต่อหรืออยู่ระหว่างบำรุงรักษา"],
      "offline",
    );
  const keys = Object.keys(ranges) as (keyof Measurements)[];
  if (keys.some((key) => station.measurements[key] == null))
    return result(
      "ไม่ควรเผา",
      ["ข้อมูลตรวจวัดไม่ครบ กรุณารอข้อมูลจากสถานี"],
      "missing",
    );
  const time = Date.parse(station.timestamp);
  if (
    keys.some((key) => !validMeasurement(key, station.measurements[key])) ||
    !Number.isFinite(time) ||
    time > now + rules.futureToleranceMinutes * 60000
  )
    return result(
      "ไม่ควรเผา",
      ["พบค่าตรวจวัดหรือเวลาที่ไม่ถูกต้อง กรุณาตรวจสอบสถานี"],
      "invalid",
    );
  if (now - time > rules.maxAgeMinutes * 60000)
    return result(
      "ไม่ควรเผา",
      [`ข้อมูลเก่ากว่า ${rules.maxAgeMinutes} นาที ไม่ควรใช้ตัดสินใจเผา`],
      "stale",
    );
  const m = station.measurements as Record<keyof Measurements, number>;
  const reasons: string[] = [];
  let level = 0;
  if (m.pm25 >= rules.pm25.caution) {
    reasons.push("ฝุ่น PM2.5 สะสมสูงขึ้นแล้ว");
    level = Math.max(level, m.pm25 >= rules.pm25.stop ? 2 : 1);
  }
  if (m.humidity < rules.humidity.cautionBelow) {
    reasons.push("ความชื้นต่ำ วัสดุทางการเกษตรติดไฟและลุกลามได้ง่าย");
    level = Math.max(level, m.humidity < rules.humidity.stopBelow ? 2 : 1);
  }
  if (m.windSpeed >= rules.windSpeed.caution) {
    reasons.push("ลมแรง อาจควบคุมไฟและควันได้ยาก");
    level = Math.max(level, m.windSpeed >= rules.windSpeed.stop ? 2 : 1);
  }
  const towards = (m.windDirection + 180) % 360;
  for (const sector of rules.communitySectors.filter(
    (s) => s.stationId === station.id,
  )) {
    if (
      Math.abs(((towards - sector.bearing + 540) % 360) - 180) <=
      sector.halfWidth
    ) {
      reasons.push(`ลมอาจพัดควันไปทาง${sector.label}`);
      level = 2;
    }
  }
  return result(
    (["เผาได้", "ไม่แนะนำ", "ไม่ควรเผา"] as const)[level],
    reasons.length
      ? reasons
      : [
          "ค่าตรวจวัดอยู่ในช่วงที่ยอมรับได้ตามเกณฑ์สาธิต โปรดตรวจสอบข้อห้ามและขออนุญาตก่อนเสมอ",
        ],
  );
}
export function assessArea(stations: Station[], now = Date.now()): Assessment {
  if (!stations.length) return assess(undefined, now);
  const ranking = { เผาได้: 0, ไม่แนะนำ: 1, ไม่ควรเผา: 2 };
  return stations
    .map((s) => assess(s, now))
    .sort((a, b) => ranking[b.status] - ranking[a.status])[0];
}
export const statusTone = {
  เผาได้: "green",
  ไม่แนะนำ: "amber",
  ไม่ควรเผา: "red",
} as const;
export const compass = (degrees: number) =>
  [
    "เหนือ",
    "ตะวันออกเฉียงเหนือ",
    "ตะวันออก",
    "ตะวันออกเฉียงใต้",
    "ใต้",
    "ตะวันตกเฉียงใต้",
    "ตะวันตก",
    "ตะวันตกเฉียงเหนือ",
  ][Math.round(degrees / 45) % 8];
