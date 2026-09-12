import { useId, useMemo, useState } from "react";
import {
  MapPin,
  Search,
  RotateCcw,
  ChevronRight,
  Radio,
  X,
} from "lucide-react";
import type { Geography } from "../data/geography";
import type { Selection, Station } from "../domain/types";
type Props = {
  geo: Geography;
  stations: Station[];
  selection: Selection;
  onSelect: (s: Selection) => void;
  onClose: () => void;
};
export const emptySelection: Selection = {
  subdistrictId: "",
  villageId: "",
  stationId: "",
};
export default function AreaPanel({
  geo,
  stations,
  selection,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState("");
  const fieldId = useId();
  const subdistricts = useMemo(
    () =>
      geo.subdistricts.features
        .slice()
        .sort((a, b) =>
          a.properties.Admin_code.localeCompare(b.properties.Admin_code),
        ),
    [geo],
  );
  const villages = geo.villages.features
    .filter((v) => String(v.properties.TB_IDN) === selection.subdistrictId)
    .sort((a, b) =>
      a.properties.VILL_CODE.localeCompare(b.properties.VILL_CODE),
    );
  const filteredStations = stations.filter(
    (s) =>
      (!selection.subdistrictId ||
        s.area.subdistrictId === selection.subdistrictId) &&
      (!selection.villageId || s.area.villageId === selection.villageId),
  );
  const area = subdistricts.find(
    (s) => s.properties.Admin_code === selection.subdistrictId,
  );
  const village = villages.find(
    (v) => String(v.properties.VILL_IDN) === selection.villageId,
  );
  return (
    <aside className="area-panel" aria-label="เลือกพื้นที่ประเมิน">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">พื้นที่ของคุณ</span>
          <h3>เลือกพื้นที่ประเมิน</h3>
        </div>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="ปิดแผงเลือกพื้นที่"
        >
          <X size={19} />
        </button>
      </div>
      <label className="field-label" htmlFor={`${fieldId}-search`}>
        ค้นหาตำบล
      </label>
      <div className="search-input">
        <Search size={17} />
        <input
          id={`${fieldId}-search`}
          placeholder="พิมพ์ชื่อตำบล…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <label className="field-label" htmlFor={`${fieldId}-subdistrict`}>
        ตำบล
      </label>
      <select
        id={`${fieldId}-subdistrict`}
        value={selection.subdistrictId}
        onChange={(e) =>
          onSelect({
            subdistrictId: e.target.value,
            villageId: "",
            stationId: "",
          })
        }
      >
        <option value="">ทุกตำบลในอำเภอปาย</option>
        {subdistricts
          .filter(
            (f) =>
              f.properties.T_Name_T.includes(search) ||
              f.properties.Admin_code === selection.subdistrictId,
          )
          .map((f) => (
            <option
              key={f.properties.Admin_code}
              value={f.properties.Admin_code}
            >
              {f.properties.T_Name_T}
            </option>
          ))}
      </select>
      {search &&
        !subdistricts.some((f) => f.properties.T_Name_T.includes(search)) && (
          <small role="status">ไม่พบตำบลที่ค้นหา</small>
        )}
      <label className="field-label" htmlFor={`${fieldId}-village`}>
        หมู่บ้าน
      </label>
      <select
        id={`${fieldId}-village`}
        disabled={!selection.subdistrictId}
        value={selection.villageId}
        onChange={(e) =>
          onSelect({ ...selection, villageId: e.target.value, stationId: "" })
        }
      >
        <option value="">
          {selection.subdistrictId ? "ทุกหมู่บ้านในตำบล" : "เลือกตำบลก่อน"}
        </option>
        {villages.map((v) => (
          <option key={v.properties.VILL_IDN} value={v.properties.VILL_IDN}>
            หมู่ {Number(v.properties.VILL_CODE)} · {v.properties.VILL_TN}
          </option>
        ))}
      </select>
      <label className="field-label" htmlFor={`${fieldId}-station`}>
        สถานีตรวจวัด
      </label>
      <select
        id={`${fieldId}-station`}
        value={selection.stationId}
        disabled={!filteredStations.length}
        onChange={(e) => {
          const s = stations.find((s) => s.id === e.target.value);
          onSelect(
            s
              ? {
                  subdistrictId: s.area.subdistrictId,
                  villageId: s.area.villageId ?? "",
                  stationId: s.id,
                }
              : { ...selection, stationId: "" },
          );
        }}
      >
        <option value="">
          {filteredStations.length
            ? "ทุกสถานีในพื้นที่"
            : "ยังไม่มีสถานีในพื้นที่นี้"}
        </option>
        {filteredStations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <div className="current-area">
        <MapPin size={19} />
        <div>
          <small>พื้นที่ที่เลือก</small>
          <strong>
            {village?.properties.VILL_TN ??
              area?.properties.T_Name_T ??
              "อำเภอปาย"}
          </strong>
          <span>
            {village ? area?.properties.T_Name_T : "จังหวัดแม่ฮ่องสอน"}
          </span>
        </div>
        <ChevronRight size={16} />
      </div>
      <div className="panel-bottom">
        <span>
          <Radio size={15} />
          {filteredStations.length} สถานีในพื้นที่
        </span>
        <button
          className="text-button"
          onClick={() => {
            onSelect(emptySelection);
            setSearch("");
          }}
        >
          <RotateCcw size={14} />
          ล้างการเลือก
        </button>
      </div>
    </aside>
  );
}
