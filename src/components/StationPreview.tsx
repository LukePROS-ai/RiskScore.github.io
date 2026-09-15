import { useEffect, useRef } from "react";
import { X, ShieldCheck, TriangleAlert, Ban, Radio } from "lucide-react";
import type { Station, Measurements } from "../domain/types";
import { assessArea, compass, statusTone, validMeasurement } from "../domain/rules";
import { formatTime } from "./Dashboard";

const metrics: [keyof Measurements, string, string][] = [
  ["pm25", "PM2.5", "µg/m³"],
  ["humidity", "ความชื้น", "%"],
  ["windSpeed", "ความเร็วลม", "m/s"],
  ["windDirection", "ทิศทางลม", "°"],
  ["pressure", "ความกดอากาศ", "hPa"],
];

export default function StationPreview({ station, stationId, location, now, message, onClose }: {
  station?: Station;
  stationId: string;
  location: string;
  now: number;
  message: string;
  onClose: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [stationId]);
  const result = assessArea(station ? [station] : [], now);
  const tone = statusTone[result.status];
  const Icon = tone === "green" ? ShieldCheck : tone === "amber" ? TriangleAlert : Ban;
  const quality = { fresh: "ข้อมูลล่าสุด", stale: "ข้อมูลเก่า", missing: "ข้อมูลไม่ครบ", invalid: "ข้อมูลผิดปกติ", offline: "ขาดการเชื่อมต่อ" }[result.quality];
  return (
    <section className={`station-preview ${tone}`} aria-labelledby="station-preview-title"
      onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <button className="preview-close" aria-label="ปิดแดชบอร์ดสถานี" onClick={onClose}><X size={20} /></button>
      <div className="preview-status">
        <span className="preview-status-icon"><Icon size={32} /></span>
        <strong>{result.status}</strong>
        <small>ผลประเมินชั่วคราว</small>
      </div>
      <div className="preview-identity">
        <span className="eyebrow"><Radio size={13} /> สถานีที่เลือก</span>
        <h2 id="station-preview-title" ref={heading} tabIndex={-1}>{station?.name ?? "สถานีที่เลือก"}</h2>
        <p>{location}</p>
        <small>{station ? formatTime(station.timestamp) : "ยังไม่มีข้อมูลล่าสุด"}</small>
        <p className="preview-quality" role="status">{message || quality}</p>
      </div>
      <div className="preview-metrics">
        {metrics.map(([key, label, unit]) => {
          const value = station?.measurements[key];
          const valid = validMeasurement(key, value);
          return <div className="preview-metric" key={key}>
            <span>{label}</span>
            <strong>{valid ? Number(value.toFixed(1)) : "—"}</strong>
            <small>{unit}{key === "windDirection" && valid ? ` · ${compass(value)}` : ""}</small>
            {!valid && <small>{value == null ? "ไม่มีข้อมูล" : "ค่าผิดปกติ"}</small>}
          </div>;
        })}
      </div>
      <div className="preview-footnote">
        <span>{result.reasons.join(" · ")}</span>
        <small>{station?.demo ? "ข้อมูลสาธิต · " : ""}ค่าปัจจุบัน · เกณฑ์สาธิต · ไม่ใช่ใบอนุญาตให้เผา</small>
        <a href="#assessment" onClick={onClose}>ดูรายละเอียดทั้งหมด →</a>
      </div>
    </section>
  );
}
