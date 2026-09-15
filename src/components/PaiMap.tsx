import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { LocateFixed, Layers, MapPin } from "lucide-react";
import type { Geography } from "../data/geography";
import type { Selection, Station } from "../domain/types";
import { assess, statusTone } from "../domain/rules";
type Props = {
  geo: Geography;
  stations: Station[];
  selection: Selection;
  onSelect: (selection: Selection) => void;
  now: number;
};
const colors = { green: "#258063", amber: "#ca8418", red: "#c65846" };
const textNode = (text: string) => {
  const node = document.createElement("span");
  node.textContent = text;
  return node;
};
export default function PaiMap({
  geo,
  stations,
  selection,
  onSelect,
  now,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const areas = useRef(new Map<string, L.GeoJSON>());
  const pins = useRef(new Map<string, L.Marker>());
  const lastNavigation = useRef<{ map: L.Map | null; key: string } | null>(
    null,
  );
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [terrain, setTerrain] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, {
      zoomControl: false,
      // Leaflet handles wheel events only inside its map container.
      scrollWheelZoom: true,
      minZoom: 8,
      maxZoom: 17,
    });
    map.current = instance;
    L.control
      .zoom({
        position: "topleft",
        zoomInTitle: "ขยายแผนที่",
        zoomOutTitle: "ย่อแผนที่",
      })
      .addTo(instance);
    L.control
      .scale({ imperial: false, position: "bottomleft" })
      .addTo(instance);
    const bounds = L.geoJSON(geo.district).getBounds();
    instance.fitBounds(bounds, { padding: [24, 24] });
    const tile = L.tileLayer(
      terrain
        ? "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: terrain ? 17 : 19,
        attribution: terrain
          ? "© OpenStreetMap contributors · SRTM | © OpenTopoMap (CC-BY-SA)"
          : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    ).addTo(instance);
    tile.on("tileerror", () => setTileError(true));
    L.geoJSON(geo.district, {
      style: {
        color: "#254e40",
        weight: 2.5,
        fill: false,
        opacity: 0.8,
        interactive: false,
      },
    }).addTo(instance);
    const labels: L.Marker[] = [];
    for (const f of geo.subdistricts.features) {
      const id = f.properties.Admin_code;
      const layer = L.geoJSON(f, {
        style: {
          color: "#607d64",
          weight: 1.4,
          fillColor: "#89a36e",
          fillOpacity: 0.12,
          dashArray: "5 4",
        },
      }).addTo(instance);
      layer.bindTooltip(textNode(f.properties.T_Name_T), {
        sticky: true,
        direction: "top",
      });
      const choose = () =>
        selectRef.current({ subdistrictId: id, villageId: "", stationId: "" });
      layer.on("click", choose);
      layer.eachLayer((part) => {
        if (part instanceof L.Path) {
          const el = part.getElement();
          if (el) {
            el.setAttribute("tabindex", "0");
            el.setAttribute("role", "button");
            el.setAttribute("aria-label", `เลือก${f.properties.T_Name_T}`);
            el.addEventListener("keydown", (e) => {
              if (
                (e as KeyboardEvent).key === "Enter" ||
                (e as KeyboardEvent).key === " "
              ) {
                e.preventDefault();
                choose();
              }
            });
          }
        }
      });
      areas.current.set(id, layer);
      labels.push(
        L.marker(layer.getBounds().getCenter(), {
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "area-label",
            html: textNode(f.properties.T_Name_T.replace("ตำบล", "")),
            iconSize: [100, 24],
            iconAnchor: [50, 12],
          }),
        }).addTo(instance),
      );
    }
    const declutter = () => {
      const placed: L.Point[] = [];
      for (const label of labels) {
        const point = instance.latLngToLayerPoint(label.getLatLng());
        const overlap = placed.some(
          (p) => Math.abs(p.x - point.x) < 110 && Math.abs(p.y - point.y) < 30,
        );
        label.setOpacity(overlap ? 0 : 1);
        if (!overlap) placed.push(point);
      }
    };
    instance.on("zoomend", declutter);
    declutter();
    for (const v of geo.villages.features) {
      const id = String(v.properties.VILL_IDN),
        [lng, lat] = v.geometry.coordinates;
      const icon = L.divIcon({
        className: "village-pin",
        html: "<span></span>",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([lat, lng], {
        icon,
        title: `${v.properties.VILL_TN} · ${v.properties.TB_TN}`,
        alt: `เลือก${v.properties.VILL_TN}`,
        zIndexOffset: 100,
      }).addTo(instance);
      marker.bindTooltip(
        textNode(
          `${v.properties.VILL_TN} · หมู่ ${Number(v.properties.VILL_CODE)} · ต.${v.properties.TB_TN}`,
        ),
      );
      marker.on("click", () =>
        selectRef.current({
          subdistrictId: String(v.properties.TB_IDN),
          villageId: id,
          stationId: "",
        }),
      );
      pins.current.set(id, marker);
    }
    const resize = new ResizeObserver(() => instance.invalidateSize());
    resize.observe(container.current);
    const areaMap = areas.current,
      pinMap = pins.current;
    return () => {
      resize.disconnect();
      instance.remove();
      map.current = null;
      areaMap.clear();
      pinMap.clear();
    };
  }, [geo, terrain]);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const group = L.layerGroup().addTo(instance);
    stations.forEach((s) => {
      const a = assess(s, now),
        tone = statusTone[a.status];
      const content = document.createElement("span");
      content.className = `station-dot ${tone}${selection.stationId === s.id ? " active" : ""}`;
      content.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 11v10m-4 0h8M9 8a4 4 0 0 1 6 0M6 5a8 8 0 0 1 12 0"/><circle cx="12" cy="10" r="1"/></svg>';
      const marker = L.marker([s.coordinates[1], s.coordinates[0]], {
        icon: L.divIcon({
          html: content,
          className: "station-marker",
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        zIndexOffset: 500,
        title: `${s.name}: ${a.status}`,
        alt: `เลือก${s.name}: ${a.status}`,
      }).addTo(group);
      const popup = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = s.name;
      popup.append(
        strong,
        document.createElement("br"),
        textNode(`${a.status} · ผลสาธิต`),
        document.createElement("br"),
        textNode(a.reasons[0]),
      );
      marker.bindTooltip(popup, { direction: "top", offset: [0, -15] });
      marker.on("click", () =>
        selectRef.current({
          subdistrictId: s.area.subdistrictId,
          villageId: s.area.villageId ?? "",
          stationId: s.id,
        }),
      );
    });
    return () => {
      group.remove();
    };
  }, [stations, selection.stationId, now, geo, terrain]);
  useEffect(() => {
    areas.current.forEach((layer, id) =>
      layer.setStyle({
        weight: selection.subdistrictId === id ? 3 : 1.4,
        color: selection.subdistrictId === id ? "#235c4b" : "#607d64",
        fillOpacity: selection.subdistrictId === id ? 0.25 : 0.12,
        dashArray: selection.subdistrictId === id ? "" : "5 4",
      }),
    );
    pins.current.forEach((marker, id) =>
      marker
        .getElement()
        ?.classList.toggle("selected", selection.villageId === id),
    );
    // Observation polling must not reset a user's pan or zoom.
    const navigationKey = JSON.stringify(selection);
    if (
      lastNavigation.current?.map === map.current &&
      lastNavigation.current.key === navigationKey
    )
      return;
    lastNavigation.current = { map: map.current, key: navigationKey };
    const station = stations.find((s) => s.id === selection.stationId);
    const village = geo.villages.features.find(
      (v) => String(v.properties.VILL_IDN) === selection.villageId,
    );
    if (station)
      map.current?.setView(
        [station.coordinates[1], station.coordinates[0]],
        13,
        { animate: false },
      );
    else if (village)
      map.current?.setView(
        [village.geometry.coordinates[1], village.geometry.coordinates[0]],
        13,
        { animate: false },
      );
    else if (selection.subdistrictId) {
      const area = areas.current.get(selection.subdistrictId);
      if (area)
        map.current?.fitBounds(area.getBounds(), {
          padding: [30, 30],
          maxZoom: 12,
          animate: false,
        });
    } else
      map.current?.fitBounds(L.geoJSON(geo.district).getBounds(), {
        padding: [24, 24],
        animate: false,
      });
  }, [selection, geo, terrain, stations]);
  return (
    <div className="map-surface">
      <div
        ref={container}
        className="map-canvas"
        aria-label="แผนที่อำเภอปาย เลือกตำบล หมู่บ้าน หรือสถานี ใช้เมนูเลือกพื้นที่แทนได้"
      />
      <div className="map-top-label">
        <MapPin size={15} /> อำเภอปาย <span>แม่ฮ่องสอน</span>
      </div>
      <div className="map-actions">
        <button
          title="แสดงทั้งอำเภอ"
          aria-label="แสดงทั้งอำเภอ"
          onClick={() =>
            map.current?.fitBounds(L.geoJSON(geo.district).getBounds(), {
              padding: [24, 24],
            })
          }
        >
          <LocateFixed size={19} />
        </button>
        <button
          title="เปลี่ยนแผนที่พื้นหลัง"
          aria-label="เปลี่ยนแผนที่พื้นหลัง"
          aria-pressed={terrain}
          onClick={() => {
            setTileError(false);
            setTerrain(!terrain);
          }}
        >
          <Layers size={19} />
        </button>
      </div>
      <div className="map-legend">
        <span className="legend-title">ผลประเมินสาธิต</span>
        {Object.entries(colors).map(([tone, color], i) => (
          <span key={tone}>
            <i style={{ background: color }} />
            {["เผาได้", "ไม่แนะนำ", "ไม่ควรเผา"][i]}
          </span>
        ))}
        <span>
          <i className="village-key" />
          หมู่บ้าน
        </span>
      </div>
      {tileError && (
        <div className="tile-warning" role="status">
          โหลดแผนที่พื้นหลังบางส่วนไม่ได้ • ยังเลือกขอบเขตและจุดพื้นที่ได้
        </div>
      )}
    </div>
  );
}
