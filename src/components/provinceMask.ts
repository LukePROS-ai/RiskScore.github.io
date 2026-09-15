import L from "leaflet";
import type { Geography } from "../data/geography";

/** Let Leaflet transform the mask with the map instead of rebuilding every move. */
export function mountProvinceMask(map: L.Map, province: Geography["province"]) {
  const pane = map.getPane("provinceMask") ?? map.createPane("provinceMask");
  pane.style.zIndex = "450";
  pane.style.pointerEvents = "none";
  // Overscan keeps the mask covering the viewport throughout dragging/zooming.
  const renderer = L.svg({ pane: "provinceMask", padding: 1 });
  const rings = province.features.flatMap(({ geometry }) => {
    const polygons = geometry.type === "Polygon"
      ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map((polygon) => polygon[0].map(
      ([lng, lat]) => [lat, lng] as L.LatLngTuple,
    ));
  });
  const mask = L.polygon([
    [[85, -180], [85, 180], [-85, 180], [-85, -180]],
    ...rings,
  ], {
    renderer,
    pane: "provinceMask",
    stroke: false,
    fillColor: "#dfebdc",
    fillOpacity: 1,
    fillRule: "evenodd",
    noClip: true,
    smoothFactor: 1,
    interactive: false,
  }).addTo(map);
  return () => {
    mask.remove();
    renderer.remove();
  };
}
