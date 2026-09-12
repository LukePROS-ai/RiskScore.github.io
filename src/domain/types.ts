export type Recommendation = "เผาได้" | "ไม่แนะนำ" | "ไม่ควรเผา";
export type Measurements = {
  pm25: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
};
export type Station = {
  id: string;
  name: string;
  coordinates: [number, number];
  area: {
    provinceId: "58";
    districtId: "5803";
    subdistrictId: string;
    villageId: string | null;
  };
  measurements: Measurements;
  timestamp: string;
  deviceStatus: "online" | "offline" | "maintenance";
  demo: boolean;
  coordinateSource: string;
};
export type SensorResponse = {
  schemaVersion: "1.0";
  generatedAt: string;
  stations: Station[];
};
export type Selection = {
  subdistrictId: string;
  villageId: string;
  stationId: string;
};
export type Assessment = {
  status: Recommendation;
  reasons: string[];
  quality: "fresh" | "missing" | "invalid" | "stale" | "offline";
  provisional: boolean;
};
export type Scenario =
  | "normal"
  | "green"
  | "amber"
  | "red"
  | "stale"
  | "missing"
  | "invalid"
  | "offline"
  | "empty"
  | "error";
