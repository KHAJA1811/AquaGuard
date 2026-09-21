import type {
  Station,
  Reading,
  Anomaly,
  Alert,
  Prediction,
  Report,
  ReportData,
  AnalysisResult,
  PredictionResponse,
} from "@/types";
import { FALLBACK_STATIONS, getFallbackReadings, getFallbackPredictions } from "@/services/fallbackData";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const API_BASE = `${SUPABASE_URL}/functions/v1/aquaguard-api`;

async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let errorMsg = "Request failed";
    try {
      const errBody = await response.json();
      errorMsg = errBody.error || errBody.message || errorMsg;
    } catch {
      errorMsg = `Request failed (${response.status})`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// ============================================================
// STATIONS
// ============================================================

export async function getStations(): Promise<Station[]> {
  try {
    const stations = await apiCall<Station[]>("/api/stations");
    if (stations.length === 0) {
      console.warn("[AquaGuard] Stations table is empty — using fallback demo stations.");
      return FALLBACK_STATIONS;
    }
    return stations;
  } catch (err) {
    console.error("[AquaGuard] Failed to fetch stations from API:", err);
    return FALLBACK_STATIONS;
  }
}

export async function createStation(
  name: string,
  location: string
): Promise<Station> {
  return apiCall<Station>("/api/stations", {
    method: "POST",
    body: JSON.stringify({ name, location }),
  });
}

// ============================================================
// READINGS
// ============================================================

export async function getReadings(
  stationId?: string,
  limit = 100
): Promise<Reading[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (stationId) params.set("stationId", stationId);
  try {
    const readings = await apiCall<Reading[]>(`/api/readings?${params}`);
    if (readings.length === 0 && stationId) {
      console.warn(`[AquaGuard] No readings for station ${stationId} — using fallback demo data.`);
      return getFallbackReadings(stationId, limit);
    }
    return readings;
  } catch (err) {
    console.error(`[AquaGuard] Failed to fetch readings:`, err);
    if (stationId) return getFallbackReadings(stationId, limit);
    return [];
  }
}

export async function getLatestReadings(): Promise<
  Record<string, { stationName: string; reading: Reading | null }>
> {
  return apiCall("/api/readings/latest");
}

export async function createReading(reading: {
  stationId: string;
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  dissolvedOxygen: number;
  conductivity: number;
}): Promise<{
  id: string;
  qualityScore: number;
  status: string;
  label: string;
  anomalies: unknown[];
  alertsGenerated: number;
}> {
  return apiCall("/api/readings", {
    method: "POST",
    body: JSON.stringify(reading),
  });
}

// ============================================================
// ANALYSIS
// ============================================================

export async function analyzeWater(params: {
  stationId?: string;
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  dissolvedOxygen: number;
  conductivity: number;
}): Promise<AnalysisResult> {
  return apiCall<AnalysisResult>("/api/analyze", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ============================================================
// PREDICTIONS
// ============================================================

export async function getPredictions(
  stationId: string,
  horizon = "24h"
): Promise<Prediction[]> {
  return apiCall<Prediction[]>(
    `/api/predictions/${stationId}?horizon=${horizon}`
  );
}

export async function predictWater(
  stationId: string,
  horizon: string
): Promise<PredictionResponse> {
  try {
    return await apiCall<PredictionResponse>("/api/predict", {
      method: "POST",
      body: JSON.stringify({ stationId, horizon }),
    });
  } catch (err) {
    console.error("[AquaGuard] Prediction API failed, using local fallback engine:", err);
    // Fetch readings for this station to power the local forecast
    try {
      const readings = await getReadings(stationId, 48);
      if (readings.length > 0) {
        return getFallbackPredictions(readings, horizon);
      }
    } catch (readErr) {
      console.error("[AquaGuard] Failed to fetch readings for fallback prediction:", readErr);
    }
    // Last resort: generate synthetic readings and forecast from those
    const syntheticReadings = getFallbackReadings(stationId, 48);
    return getFallbackPredictions(syntheticReadings, horizon);
  }
}

// ============================================================
// ANOMALIES
// ============================================================

export async function getAnomalies(stationId?: string): Promise<Anomaly[]> {
  const params = new URLSearchParams();
  if (stationId) params.set("stationId", stationId);
  const query = params.toString() ? `?${params}` : "";
  try {
    return await apiCall<Anomaly[]>(`/api/anomalies${query}`);
  } catch (err) {
    console.error("[AquaGuard] Failed to fetch anomalies:", err);
    return [];
  }
}

export async function resolveAnomaly(id: string): Promise<Anomaly> {
  return apiCall<Anomaly>(`/api/anomalies/${id}/resolve`, { method: "PUT" });
}

export async function detectAnomalies(stationId: string): Promise<{
  anomalies: Anomaly[];
}> {
  return apiCall("/api/anomalies/detect", {
    method: "POST",
    body: JSON.stringify({ stationId }),
  });
}

// ============================================================
// ALERTS
// ============================================================

export async function getAlerts(stationId?: string): Promise<Alert[]> {
  const params = new URLSearchParams();
  if (stationId) params.set("stationId", stationId);
  const query = params.toString() ? `?${params}` : "";
  try {
    return await apiCall<Alert[]>(`/api/alerts${query}`);
  } catch (err) {
    console.error("[AquaGuard] Failed to fetch alerts:", err);
    return [];
  }
}

export async function markAlertRead(id: string): Promise<Alert> {
  return apiCall<Alert>(`/api/alerts/${id}/read`, { method: "PUT" });
}

export async function dismissAlert(id: string): Promise<Alert> {
  return apiCall<Alert>(`/api/alerts/${id}/dismiss`, { method: "PUT" });
}

// ============================================================
// REPORTS
// ============================================================

export async function generateReport(params: {
  stationId: string;
  startDate: string;
  endDate: string;
}): Promise<{ reportId: string; generatedAt: string; reportData: ReportData }> {
  return apiCall("/api/reports/generate", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getReports(stationId?: string): Promise<Report[]> {
  const params = new URLSearchParams();
  if (stationId) params.set("stationId", stationId);
  const query = params.toString() ? `?${params}` : "";
  return apiCall<Report[]>(`/api/reports${query}`);
}

export async function getReport(id: string): Promise<Report> {
  return apiCall<Report>(`/api/reports/${id}`);
}
