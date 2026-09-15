import L from "leaflet";
import type { Geography } from "../data/geography";

/** A viewport-sized mask cannot expose tile strips when Leaflet pans its panes. */
export function mountProvinceMask(map: L.Map, province: Geography["province"]) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.classList.add("province-mask");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("fill", "#dfebdc");
  path.setAttribute("fill-rule", "evenodd");
  svg.append(path);
  map.getContainer().append(svg);
  const rings = province.features.flatMap(({ geometry }) => {
    const polygons = geometry.type === "Polygon"
      ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map((polygon) => polygon[0]);
  });
  const redraw = () => {
    const size = map.getSize();
    const holes = rings.map((ring) => ring.map(([lng, lat], i) => {
      const p = map.latLngToContainerPoint([lat, lng]);
      return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
    }).join(" ") + "Z").join(" ");
    path.setAttribute("d", `M0,0H${size.x}V${size.y}H0Z ${holes}`);
  };
  map.on("move zoom resize viewreset", redraw);
  redraw();
  return () => {
    map.off("move zoom resize viewreset", redraw);
    svg.remove();
  };
}
