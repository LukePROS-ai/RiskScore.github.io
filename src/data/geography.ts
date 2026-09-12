import type { FeatureCollection, MultiPolygon, Polygon, Point } from "geojson";
export type SubdistrictProperties = {
  Admin_code: string;
  T_Name_T: string;
  T_Name_E: string;
  Source_Nam: string;
  Source_dat: number;
};
export type VillageProperties = {
  VILL_IDN: number;
  VILL_CODE: string;
  VILL_TN: string;
  TB_IDN: number;
  TB_TN: string;
  YEAR_: number;
};
export type Geography = {
  subdistricts: FeatureCollection<
    Polygon | MultiPolygon,
    SubdistrictProperties
  >;
  villages: FeatureCollection<Point, VillageProperties>;
  district: FeatureCollection<Polygon | MultiPolygon>;
};
export const geographySource =
  "https://gistdaportal.gistda.or.th/arcgis/rest/services/" +
  encodeURIComponent("ข้อมูลเขตการปกครอง") +
  "/MapServer";
export async function loadGeography(signal?: AbortSignal): Promise<Geography> {
  const [subdistricts, villages, district] = await Promise.all(
    ["subdistricts", "villages", "district"].map(async (name) => {
    const response = await fetch(`${import.meta.env.BASE_URL}data/${name}.geojson`, {
      signal,
    });
      if (!response.ok) throw new Error("โหลดข้อมูลแผนที่ไม่สำเร็จ");
      const data = await response.json();
      if (data.type !== "FeatureCollection" || !Array.isArray(data.features))
        throw new Error("รูปแบบข้อมูลแผนที่ไม่ถูกต้อง");
      return data;
    }),
  );
  return { subdistricts, villages, district };
}
