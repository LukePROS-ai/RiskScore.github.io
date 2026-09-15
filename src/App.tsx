import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Info,
  Leaf,
  MapPin,
  Mountain,
  Radio,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  WifiOff,
} from "lucide-react";
import {
  geographySource,
  loadGeography,
  type Geography,
} from "./data/geography";
import { assess, assessArea, statusTone } from "./domain/rules";
import type { Scenario, Selection, SensorResponse } from "./domain/types";
import { apiUrl, getSensors } from "./services/sensors";
import PaiMap from "./components/PaiMap";
import AreaPanel, { emptySelection } from "./components/AreaPanel";
import Dashboard, { formatTime } from "./components/Dashboard";
import RulesDetails from "./components/RulesDetails";
import StationPreview from "./components/StationPreview";
const scenarios: Record<Scenario, string> = {
  normal: "สถานีตัวอย่าง",
  green: "เผาได้",
  amber: "ไม่แนะนำ",
  red: "ไม่ควรเผา",
  stale: "ข้อมูลเก่า",
  missing: "ข้อมูลขาดหาย",
  invalid: "ค่าผิดปกติ",
  offline: "สถานีออฟไลน์",
  empty: "ไม่มีสถานี",
  error: "เชื่อมต่อไม่ได้",
};
export default function App() {
  const [geo, setGeo] = useState<Geography>();
  const [geoError, setGeoError] = useState("");
  const [data, setData] = useState<SensorResponse>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [refresh, setRefresh] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [panelOpen, setPanelOpen] = useState(true);
  const [stationPreviewOpen, setStationPreviewOpen] = useState(false);
  const stationTrigger = useRef<HTMLElement | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const drawer = useRef<HTMLDialogElement>(null);
  const drawerTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 761px)");
    const closeOnDesktop = () => {
      if (desktop.matches) drawer.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    setGeoError("");
    loadGeography(ctrl.signal)
      .then(setGeo)
      .catch((e) => {
        if (e.name !== "AbortError") setGeoError(e.message);
      });
    return () => ctrl.abort();
  }, [refresh]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!geo) return;
    const ctrl = new AbortController();
    let active = true;
    const read = () => {
      setLoading(true);
      setError("");
      getSensors(geo, scenario, ctrl.signal)
        .then((next) => {
          if (active) {
            setData(next);
            setNow(Date.now());
          }
        })
        .catch((e) => {
          if (active && e.name !== "AbortError") {
            setError(e.message);
            setData(undefined);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    read();
    const timer = setInterval(read, 60000);
    return () => {
      active = false;
      ctrl.abort();
      clearInterval(timer);
    };
  }, [geo, scenario, refresh]);
  const onSelect = useCallback((s: Selection) => {
    setSelection(s);
    setStationPreviewOpen(Boolean(s.stationId));
    if (s.stationId) {
      stationTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      drawer.current?.close();
    }
  }, []);
  const closeStationPreview = () => {
    setStationPreviewOpen(false);
    if (stationTrigger.current?.isConnected) stationTrigger.current.focus({ preventScroll: true });
  };
  const available = useMemo(
    () => (online && !error && !loading ? (data?.stations ?? []) : []),
    [data, error, online, loading],
  );
  const chosen = available.filter(
    (s) =>
      (!selection.subdistrictId ||
        s.area.subdistrictId === selection.subdistrictId) &&
      (!selection.villageId || s.area.villageId === selection.villageId) &&
      (!selection.stationId || s.id === selection.stationId),
  );
  const assessment = assessArea(chosen, now);
  const representative = chosen.find(
    (s) => assess(s, now).status === assessment.status,
  );
  const selectedArea = geo?.subdistricts.features.find(
    (s) => s.properties.Admin_code === selection.subdistrictId,
  );
  const selectedVillage = geo?.villages.features.find(
    (v) => String(v.properties.VILL_IDN) === selection.villageId,
  );
  const title = selection.stationId
    ? (representative?.name ?? "สถานีที่เลือก")
    : (selectedVillage?.properties.VILL_TN ??
      selectedArea?.properties.T_Name_T ??
      "ภาพรวมอำเภอปาย");
  const closeDrawer = () => {
    drawer.current?.close();
    drawerTrigger.current?.focus();
  };
  return (
    <>
      <a className="skip-link" href="#assessment">
        ข้ามไปผลประเมิน
      </a>
      <header className="site-header">
        <a className="brand" href="#">
          <span className="brand-icon">
            <Mountain size={27} />
          </span>
          <div>
            <strong>
              ปายอากาศดี<span className="brand-en">PAI AIR</span>
            </strong>
            <small>ระบบสนับสนุนการตัดสินใจเผาในพื้นที่เกษตร</small>
          </div>
        </a>
        <div className="header-right">
          <span className="system-status">
            <span className={online ? "live-dot" : "offline-dot"} />
            {apiUrl ? "ข้อมูลจากสถานี" : "ระบบสาธิต"}
          </span>
          <div className="last-update">
            <span>อัปเดตระบบล่าสุด</span>
            <strong>
              {data ? formatTime(data.generatedAt) : "กำลังเชื่อมต่อ…"}
            </strong>
          </div>
          <button
            className="icon-button"
            aria-label="รีเฟรชข้อมูล"
            onClick={() => setRefresh((v) => v + 1)}
            disabled={loading && !geoError}
          >
            <RefreshCw size={18} className={loading ? "spinning" : ""} />
          </button>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="breadcrumb">
              แม่ฮ่องสอน <ChevronRight size={12} /> อำเภอปาย
            </div>
            <h1>
              รู้สภาพอากาศ ก่อนตัดสินใจเผา
              <span className="heading-leaf">
                <Leaf size={24} />
              </span>
            </h1>
            <p>
              ตรวจสอบสภาพแวดล้อมและคำแนะนำในพื้นที่ของคุณ จากสถานีตรวจวัดภาคสนาม
            </p>
          </div>
          <a className="method-link" href="#method">
            อ่านเกณฑ์การประเมิน <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="demo-notice">
          <Info size={17} />
          <span>
            <strong>{apiUrl ? "ผลประเมินใช้เกณฑ์สาธิต" : "โหมดสาธิต"}</strong> ·{" "}
            {apiUrl
              ? "ยังไม่ใช่เกณฑ์ที่ได้รับการรับรอง"
              : "ค่าตรวจวัดและตำแหน่งสถานีเป็นตัวอย่าง"}{" "}
            ใช้เพื่อทดลองระบบเท่านั้น
          </span>
          {!apiUrl && (
            <div className="demo-control">
              <label htmlFor="scenario">ทดลองสถานการณ์</label>
              <select
                id="scenario"
                value={scenario}
                onChange={(e) => setScenario(e.target.value as Scenario)}
              >
                {Object.entries(scenarios).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <section className="map-section" aria-labelledby="map-title">
          <div className="section-bar">
            <div>
              <span className="section-number">01</span>
              <h2 id="map-title">แผนที่พื้นที่ประเมิน</h2>
              <span className="subtle">
                เลือกพื้นที่บนแผนที่หรือใช้เมนูด้านข้าง
              </span>
            </div>
            <button
              className="panel-toggle desktop-toggle"
              aria-expanded={panelOpen}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              <SlidersHorizontal size={16} />
              เลือกพื้นที่
              <ChevronDown size={15} />
            </button>
            <button
              className="panel-toggle mobile-toggle"
              ref={drawerTrigger}
              onClick={() => drawer.current?.showModal()}
            >
              <SlidersHorizontal size={16} />
              เลือกพื้นที่
            </button>
          </div>
          {geo ? (
            <div className={`map-layout ${panelOpen ? "" : "panel-collapsed"}`}>
              <PaiMap
                geo={geo}
                stations={available}
                selection={selection}
                onSelect={onSelect}
                now={now}
              />
              {panelOpen && (
                <div className="desktop-panel">
                  <AreaPanel
                    geo={geo}
                    stations={available}
                    selection={selection}
                    onSelect={onSelect}
                    onClose={() => setPanelOpen(false)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="map-placeholder" role="status">
              <Mountain size={42} />
              <p>{geoError || "กำลังเตรียมแผนที่อำเภอปาย…"}</p>
              {geoError && (
                <button onClick={() => setRefresh((v) => v + 1)}>
                  ลองอีกครั้ง
                </button>
              )}
            </div>
          )}
          <div className="map-data-note">
            <Info size={14} />
            <span>
              ขอบเขต 7 ตำบล · จุดหมู่บ้าน 62 แห่งจาก GISTDA (ข้อมูลเดิม) •
              ยังไม่ครบ 66 หมู่บ้านตามข้อมูล อบจ. • ยังไม่มีแนวเขตหมู่บ้าน
            </span>
            <a href="#sources">
              ที่มาข้อมูล <ArrowUpRight size={13} />
            </a>
          </div>
        </section>
        <section
          id="assessment"
          className="assessment-section"
          aria-labelledby="area-title"
        >
          <div className="summary-heading">
            <div>
              <span className="eyebrow">
                <MapPin size={14} />
                พื้นที่ที่เลือก
              </span>
              <h2 id="area-title">{title}</h2>
              <p>
                {selectedVillage
                  ? `${selectedArea?.properties.T_Name_T} · `
                  : ""}
                อำเภอปาย จังหวัดแม่ฮ่องสอน
              </p>
            </div>
            <div className="summary-meta">
              <Radio size={18} />
              <strong>{chosen.length}</strong> สถานีในพื้นที่{" "}
              <span className="meta-divider" />
              ข้อมูลปัจจุบัน
            </div>
          </div>
          {!online && (
            <div className="service-message" role="alert">
              <WifiOff size={18} />
              อุปกรณ์นี้ออฟไลน์ ไม่สามารถยืนยันข้อมูลล่าสุดได้
            </div>
          )}
          {loading && (
            <div className="service-message" role="status">
              <RefreshCw size={16} className="spinning" />
              กำลังโหลดข้อมูลตรวจวัด กรุณารอผลล่าสุด
            </div>
          )}
          {error && (
            <div className="service-message" role="alert">
              {error}
              <button onClick={() => setRefresh((v) => v + 1)}>
                ลองอีกครั้ง
              </button>
            </div>
          )}
          {!loading && !error && !chosen.length && (
            <div className="service-message" role="status">
              ยังไม่มีข้อมูลสถานีสำหรับพื้นที่นี้
              เลือกพื้นที่อื่นจากแผนที่หรือเมนู
            </div>
          )}
          <Dashboard
            assessment={assessment}
            station={representative}
            stationLocation={
              representative
                ? [
                    geo?.villages.features.find(
                      (v) =>
                        String(v.properties.VILL_IDN) ===
                        representative.area.villageId,
                    )?.properties.VILL_TN,
                    geo?.subdistricts.features.find(
                      (a) =>
                        a.properties.Admin_code ===
                        representative.area.subdistrictId,
                    )?.properties.T_Name_T,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : undefined
            }
            count={chosen.length}
            now={now}
          />
          {chosen.length > 1 && (
            <div className="station-list" aria-label="สถานีในพื้นที่">
              {chosen.map((s) => (
                <button
                  key={s.id}
                  className="station-list-item"
                  onClick={() =>
                    onSelect({
                      subdistrictId: s.area.subdistrictId,
                      villageId: s.area.villageId ?? "",
                      stationId: s.id,
                    })
                  }
                >
                  <Radio size={16} />
                  <span>{s.name}</span>
                  <span
                    className={`mini-status ${statusTone[assess(s, now).status]}`}
                  >
                    {assess(s, now).status}
                  </span>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="safety-notice">
          <ShieldAlert size={23} />
          <div>
            <h3>ตรวจสอบข้อกำหนดในพื้นที่ก่อนเผาทุกครั้ง</h3>
            <p>
              ข้อมูลนี้ช่วยประกอบการตัดสินใจเท่านั้น ไม่แทนที่กฎหมาย
              ประกาศห้ามเผา ใบอนุญาต หรือคำสั่งของหน่วยงานท้องถิ่น แม้ผลแสดง
              “เผาได้” ก็ต้องปฏิบัติตามข้อกำหนดที่มีผลบังคับใช้
            </p>
          </div>
        </section>
        <RulesDetails />
      </main>
      <footer id="sources">
        <div className="footer-brand">
          <Mountain size={22} />
          <strong>ปายอากาศดี</strong>
          <span>เพื่ออากาศที่ดีของทุกคน</span>
        </div>
        <p>
          ขอบเขตตำบลและอำเภอ:{" "}
          <a href={geographySource} target="_blank" rel="noreferrer">
            GISTDA / DOPA (2556)
          </a>{" "}
          · จุดหมู่บ้าน: GISTDA (2552) ·{" "}
          <a
            href="https://home.mhs-pao.go.th/index.php?Itemid=210&catid=55&id=3167:650720-1117&option=com_content&view=article"
            target="_blank"
            rel="noreferrer"
          >
            ข้อมูล 66 หมู่บ้าน: อบจ.แม่ฮ่องสอน (2565)
          </a>
          <br />
          ต้องยืนยันทะเบียนและแนวเขตปัจจุบันกับหน่วยงานในพื้นที่ •
          ค่าตรวจวัดสาธิตไม่ใช่ข้อมูลภาคสนาม
        </p>
      </footer>
      {stationPreviewOpen && selection.stationId && (
        <StationPreview
          stationId={selection.stationId}
          station={available.find((station) => station.id === selection.stationId)}
          location={[selectedVillage?.properties.VILL_TN, selectedArea?.properties.T_Name_T, "อำเภอปาย"].filter(Boolean).join(" · ")}
          now={now}
          message={!online ? "อุปกรณ์นี้ออฟไลน์" : loading ? "กำลังโหลดข้อมูลล่าสุด…" : error}
          onClose={closeStationPreview}
        />
      )}
      <dialog
        ref={drawer}
        aria-label="เลือกพื้นที่ประเมิน"
        className="mobile-drawer"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeDrawer();
        }}
        onClose={() => drawerTrigger.current?.focus()}
      >
        {geo && (
          <AreaPanel
            geo={geo}
            stations={available}
            selection={selection}
            onSelect={onSelect}
            onClose={closeDrawer}
          />
        )}
        <button className="drawer-done" onClick={closeDrawer}>
          ดูผลประเมินพื้นที่นี้
        </button>
      </dialog>
    </>
  );
}
