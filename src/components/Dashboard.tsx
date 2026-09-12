import {
  ShieldCheck,
  TriangleAlert,
  Ban,
  Droplets,
  Wind,
  Gauge,
  MoveUpRight,
  Radio,
  Clock3,
  CloudFog,
  CircleHelp,
  Check,
  WifiOff,
} from "lucide-react";
import type { Assessment, Measurements, Station } from "../domain/types";
import { assess, compass, statusTone, validMeasurement } from "../domain/rules";
export const formatTime = (time: string) =>
  Number.isFinite(Date.parse(time))
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(time))
    : "เวลาไม่ถูกต้อง";
const qualityText = {
  fresh: "ข้อมูลล่าสุด",
  stale: "ข้อมูลเก่า",
  missing: "ข้อมูลไม่ครบ",
  invalid: "ข้อมูลผิดปกติ",
  offline: "ขาดการเชื่อมต่อ",
};
export default function Dashboard({
  assessment,
  station,
  stationLocation,
  count,
  now,
}: {
  assessment: Assessment;
  station?: Station;
  stationLocation?: string;
  count: number;
  now: number;
}) {
  const tone = statusTone[assessment.status],
    Icon =
      tone === "green" ? ShieldCheck : tone === "amber" ? TriangleAlert : Ban;
  const quality = station ? assess(station, now).quality : "missing";
  const metrics: {
    key: keyof Measurements;
    label: string;
    unit: string;
    icon: typeof Wind;
    hint: string;
  }[] = [
    {
      key: "pm25",
      label: "ฝุ่นละออง PM2.5",
      unit: "µg/m³",
      icon: CloudFog,
      hint: "ค่าปัจจุบัน ไม่ใช่ค่าเฉลี่ย 24 ชั่วโมง",
    },
    {
      key: "humidity",
      label: "ความชื้นสัมพัทธ์",
      unit: "%",
      icon: Droplets,
      hint: "ความชื้นในอากาศ",
    },
    {
      key: "windSpeed",
      label: "ความเร็วลม",
      unit: "m/s",
      icon: Wind,
      hint: "ความเร็วลม ณ จุดตรวจวัด",
    },
    {
      key: "windDirection",
      label: "ทิศทางลม",
      unit: "°",
      icon: MoveUpRight,
      hint: "ทิศที่ลมพัดมา (อุตุนิยมวิทยา)",
    },
    {
      key: "pressure",
      label: "ความกดอากาศ",
      unit: "hPa",
      icon: Gauge,
      hint: "ความกดอากาศ ณ ระดับสถานี",
    },
  ];
  return (
    <>
      <section
        className={`recommendation ${tone}`}
        aria-labelledby="recommendation-title"
        aria-live="polite"
      >
        <div className="recommendation-main">
          <span className="status-symbol">
            <Icon size={30} />
          </span>
          <div>
            <span className="eyebrow">คำแนะนำสำหรับพื้นที่ที่เลือก</span>
            <h2 id="recommendation-title">{assessment.status}</h2>
            <p>{assessment.reasons[0]}</p>
          </div>
        </div>
        <div className="recommendation-note">
          <span className="provisional">
            <CircleHelp size={14} />
            ผลประเมินชั่วคราว · เกณฑ์สาธิต
          </span>
          <p>
            {count > 1
              ? `ใช้ผลที่ระมัดระวังที่สุดจาก ${count} สถานี`
              : "ประเมินจากข้อมูลตรวจวัดปัจจุบัน"}
            <br />
            ไม่ใช่การอนุญาตให้เผาตามกฎหมาย
          </p>
        </div>
      </section>
      <div className="readings-heading">
        <h3>สภาพแวดล้อม ณ จุดตรวจวัด</h3>
        <span>
          <Clock3 size={14} />
          {station ? formatTime(station.timestamp) : "ยังไม่มีข้อมูลอัปเดต"}
        </span>
      </div>
      {count > 1 && (
        <p className="measurement-context">
          ค่าด้านล่างจาก {station?.name}{" "}
          ซึ่งเป็นสถานีที่กำหนดผลประเมินของพื้นที่ ไม่ใช่ค่าเฉลี่ยทุกสถานี
        </p>
      )}
      <div className="metric-grid">
        {metrics.map(({ key, label, unit, icon: MetricIcon, hint }) => {
          const value = station?.measurements[key],
            valid = validMeasurement(key, value);
          return (
            <article
              className={`metric-card ${key === "pm25" ? "primary-metric" : ""}`}
              key={key}
            >
              <div className="metric-top">
                <span>{label}</span>
                <MetricIcon
                  size={19}
                  style={
                    key === "windDirection" && valid
                      ? { transform: `rotate(${value - 45}deg)` }
                      : undefined
                  }
                />
              </div>
              <div className="metric-value">
                {valid
                  ? key === "windDirection"
                    ? value.toFixed(0)
                    : Number(value.toFixed(1))
                  : "—"}
                <span>{unit}</span>
              </div>
              <div className="metric-hint">
                {!station || value == null
                  ? "ไม่มีข้อมูล"
                  : !valid
                    ? "ค่าผิดปกติ ไม่ใช้ประเมิน"
                    : key === "windDirection"
                      ? `จากทิศ${compass(value)}`
                      : hint}
              </div>
              {quality !== "fresh" && (
                <span className="data-quality">{qualityText[quality]}</span>
              )}
            </article>
          );
        })}
      </div>
      <div className="detail-grid">
        <section className="explanation">
          <h3>
            <CircleHelp size={18} />
            เหตุผลประกอบการประเมิน
          </h3>
          <ul>
            {assessment.reasons.map((reason) => (
              <li key={reason}>
                {tone === "green" ? (
                  <Check size={17} />
                ) : (
                  <TriangleAlert size={17} />
                )}
                <span>{reason}</span>
              </li>
            ))}
          </ul>
          <p>
            ยังไม่ได้กำหนดแนวชุมชนปลายลม จึงยังไม่ประเมินผลกระทบควันต่อชุมชน
          </p>
        </section>
        <section className="station-detail">
          <h3>
            <Radio size={18} />
            สถานีที่ใช้ประเมิน
          </h3>
          <strong>{station?.name ?? "ไม่มีสถานีในพื้นที่ที่เลือก"}</strong>
          {stationLocation && <small>{stationLocation} · อำเภอปาย</small>}
          <span
            className={`connection ${quality === "fresh" ? "connected" : ""}`}
          >
            {quality === "fresh" ? <Radio size={14} /> : <WifiOff size={14} />}{" "}
            {qualityText[quality]}
          </span>
          <p>
            {station
              ? `${station.coordinates[1].toFixed(5)}° N, ${station.coordinates[0].toFixed(5)}° E`
              : "เลือกพื้นที่อื่น หรือรอการติดตั้งสถานี"}
          </p>
          {station?.demo && (
            <small>
              พิกัดอ้างอิงหมู่บ้านจาก GISTDA ใช้วางจุดสาธิตเท่านั้น
              <br />
              ไม่ใช่พิกัดอุปกรณ์ที่ติดตั้งจริง
            </small>
          )}
        </section>
      </div>
    </>
  );
}
