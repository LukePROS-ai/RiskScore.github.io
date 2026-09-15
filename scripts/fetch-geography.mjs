// Reproducible, read-only queries against the public GISTDA service.
import { mkdir, writeFile } from "node:fs/promises";
const base =
  "https://gistdaportal.gistda.or.th/arcgis/rest/services/" +
  encodeURIComponent("ข้อมูลเขตการปกครอง") +
  "/MapServer";
await mkdir("public/data", { recursive: true });
for (const [layer, file, where, fields] of [
  [
    4,
    "subdistricts",
    "P_code='58' AND A_code='03'",
    "Admin_code,T_Name_T,T_Name_E,Source_Nam,Source_dat",
  ],
  [
    1,
    "villages",
    "AP_IDN=5803",
    "VILL_IDN,VILL_CODE,VILL_TN,TB_IDN,TB_TN,YEAR_",
  ],
  [3, "district", "P_code='58' AND A_code='03'", "*"],
  [3, "province", "P_code='58'", "*"],
]) {
  if (process.argv.includes("--province-only") && file !== "province") continue;
  const params = new URLSearchParams({
    where,
    outFields: fields,
    outSR: "4326",
    f: "geojson",
    returnGeometry: "true",
    geometryPrecision: "6",
  });
  const response = await fetch(`${base}/${layer}/query?${params}`, {
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error(`GISTDA HTTP ${response.status}`);
  const data = await response.json();
  if (data.error || !data.features?.length || data.exceededTransferLimit)
    throw new Error(JSON.stringify(data));
  await writeFile(`public/data/${file}.geojson`, JSON.stringify(data));
  console.log(
    file,
    data.features.length,
    data.features.slice(0, 2).map((f) => f.properties),
  );
}
