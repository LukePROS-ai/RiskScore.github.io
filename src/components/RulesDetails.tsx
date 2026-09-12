import { ChevronDown } from "lucide-react";
import { assessmentRules as rules } from "../domain/rules";
export default function RulesDetails() {
  return (
    <details id="method" className="method">
      <summary>
        เกณฑ์สาธิตและข้อจำกัดของการประเมิน <ChevronDown size={17} />
      </summary>
      <div>
        <p>
          เกณฑ์ต่อไปนี้สร้างเพื่อทดสอบระบบ
          ไม่ใช่มาตรฐานความปลอดภัยหรือเกณฑ์ทางกฎหมาย
        </p>
        <ul>
          <li>
            PM2.5 ตั้งแต่ {rules.pm25.caution} µg/m³: ไม่แนะนำ • ตั้งแต่{" "}
            {rules.pm25.stop} µg/m³: ไม่ควรเผา
          </li>
          <li>
            ความชื้นต่ำกว่า {rules.humidity.cautionBelow}%: ไม่แนะนำ • ต่ำกว่า{" "}
            {rules.humidity.stopBelow}%: ไม่ควรเผา
          </li>
          <li>
            ความเร็วลมตั้งแต่ {rules.windSpeed.caution} m/s: ไม่แนะนำ • ตั้งแต่{" "}
            {rules.windSpeed.stop} m/s: ไม่ควรเผา
          </li>
          <li>
            ข้อมูลเก่ากว่า {rules.maxAgeMinutes} นาที ข้อมูลไม่ครบ ค่าผิดปกติ
            หรือสถานีออฟไลน์: ไม่ควรเผา
          </li>
        </ul>
        <p>
          ใช้ปัจจัยที่ให้ผลระมัดระวังที่สุด
          ผลจากสถานีไม่ยืนยันสภาพอากาศของทุกแปลงในพื้นที่ ไม่มีการพยากรณ์
          และยังต้องสำรวจแนวชุมชนปลายลมก่อนเปิดใช้กฎทิศทางควัน
        </p>
        <small>รุ่นเกณฑ์: {rules.version}</small>
      </div>
    </details>
  );
}
