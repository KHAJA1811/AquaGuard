import type { Station, Reading, PredictionResponse, PredictionResult } from "@/types";

export const FALLBACK_STATIONS: Station[] = [
  {
    id: "demo-station-001",
    name: "Campus Main Tank",
    location: "Engineering Block A, Campus",
    status: "online",
    sensor_health: "good",
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-station-002",
    name: "Reservoir",
    location: "North Campus Reservoir",
    status: "online",
    sensor_health: "good",
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-station-003",
    name: "Treatment Plant",
    location: "Water Treatment Facility, East Wing",
    status: "online",
    sensor_health: "good",
    last_sync: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

function generateReadings(stationId: string, count: number): Reading[] {
  const readings: Reading[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const ts = new Date(now - i * 30 * 60 * 1000);
    const phase = Math.sin(i / 24 * 2 * Math.PI);
    const noise = (Math.random() - 0.5) * 2;
    const ph = 7.0 + phase * 0.3 + noise * 0.1;
    const turbidity = 2.5 + phase * 0.5 + Math.abs(noise) * 0.3;
    const temperature = 25.0 + phase * 2.0 + noise * 0.5;
    const tds = 300 + phase * 20 + noise * 10;
    const dox = 7.5 + phase * 0.5 + noise * 0.2;
    const conductivity = 450 + phase * 30 + noise * 15;
    const score = Math.max(0, Math.min(100,
      100 - Math.abs(ph - 7.0) * 8
        - (turbidity > 5 ? (turbidity - 5) * 3 : 0)
        - (tds > 500 ? (tds - 500) * 0.05 : 0)
        - (dox < 5 ? (5 - dox) * 5 : 0)
        - (temperature > 30 ? (temperature - 30) * 2 : 0)
        - (conductivity > 600 ? (conductivity - 600) * 0.05 : 0)
    ));
    const status = score >= 75 ? "safe" : score >= 50 ? "warning" : "critical";
    readings.push({
      id: `demo-reading-${stationId}-${i}`,
      station_id: stationId,
      timestamp: ts.toISOString(),
      ph: Math.round(ph * 100) / 100,
      turbidity: Math.round(turbidity * 100) / 100,
      temperature: Math.round(temperature * 100) / 100,
      tds: Math.round(tds * 100) / 100,
      dissolved_oxygen: Math.round(dox * 100) / 100,
      conductivity: Math.round(conductivity * 100) / 100,
      quality_score: Math.round(score * 100) / 100,
      status: status as Reading["status"],
      is_anomaly: false,
    });
  }
  return readings;
}

export function getFallbackReadings(stationId: string, limit = 200): Reading[] {
  return generateReadings(stationId, Math.min(limit, 48));
}

// ============================================================
// FALLBACK PREDICTION ENGINE
// Client-side trend-based forecasting using linear regression
// with mean reversion — mirrors the edge function's demo engine.
// ============================================================

const PARAM_KEYS: Array<{ key: keyof Reading; label: string }> = [
  { key: "ph", label: "pH" },
  { key: "turbidity", label: "Turbidity" },
  { key: "temperature", label: "Temperature" },
  { key: "tds", label: "TDS" },
  { key: "dissolved_oxygen", label: "Dissolved Oxygen" },
  { key: "conductivity", label: "Conductivity" },
];

const PARAM_RANGES: Record<string, { min: number; max: number; ideal: number }> = {
  ph: { min: 6.5, max: 8.5, ideal: 7.0 },
  turbidity: { min: 0, max: 5, ideal: 1 },
  temperature: { min: 15, max: 30, ideal: 25 },
  tds: { min: 0, max: 500, ideal: 300 },
  dissolved_oxygen: { min: 5, max: 14, ideal: 8 },
  conductivity: { min: 0, max: 600, ideal: 400 },
};

function getParamStatus(key: string, value: number): "normal" | "warning" | "critical" {
  const range = PARAM_RANGES[key];
  if (!range) return "normal";
  if (key === "ph") {
    if (value < 5.5 || value > 9.5) return "critical";
    if (value < 6.5 || value > 8.5) return "warning";
  } else if (key === "turbidity") {
    if (value > 15) return "critical";
    if (value > 5) return "warning";
  } else if (key === "tds") {
    if (value > 800) return "critical";
    if (value > 500) return "warning";
  } else if (key === "dissolved_oxygen") {
    if (value < 3) return "critical";
    if (value < 5) return "warning";
  } else if (key === "conductivity") {
    if (value > 1000) return "critical";
    if (value > 600) return "warning";
  } else if (key === "temperature") {
    if (value > 35 || value < 10) return "critical";
    if (value > 30 || value < 15) return "warning";
  }
  return "normal";
}

function getRiskLevel(status: "normal" | "warning" | "critical"): string {
  if (status === "critical") return "high";
  if (status === "warning") return "medium";
  return "low";
}

export function getFallbackPredictions(
  readings: Reading[],
  horizon: string
): PredictionResponse {
  const horizonHours = horizon === "6h" ? 6 : horizon === "24h" ? 24 : 168;
  const stepsAhead = horizonHours / 0.5;

  // Use up to 48 most recent readings, oldest first for regression
  const history = readings.slice(0, 48).reverse();

  const predictions: PredictionResult[] = [];

  for (const param of PARAM_KEYS) {
    const values = history.map((r) => r[param.key] as number);

    // If we don't have enough data, use the latest value as both current and predicted
    if (values.length < 3) {
      const current = values[values.length - 1] ?? 0;
      predictions.push({
        parameter: param.label,
        currentValue: Math.round(current * 100) / 100,
        predictedValue: Math.round(current * 100) / 100,
        trend: "stable",
        confidence: 70,
        riskLevel: getRiskLevel(getParamStatus(param.key as string, current)),
        horizon,
      });
      continue;
    }

    const currentValue = values[values.length - 1];
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    const slope = denominator > 0 ? numerator / denominator : 0;

    // Project forward with mean reversion (70% trend, 30% mean reversion)
    let predictedValue = currentValue + slope * stepsAhead;
    predictedValue = predictedValue * 0.7 + yMean * 0.3;
    predictedValue = Math.round(predictedValue * 100) / 100;

    // Determine trend
    const trendThreshold = Math.abs(yMean) * 0.02;
    let trend = "stable";
    if (slope > trendThreshold) trend = "increasing";
    else if (slope < -trendThreshold) trend = "decreasing";

    // Calculate confidence from R²
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = yMean + slope * (i - xMean);
      ssRes += (values[i] - predicted) ** 2;
      ssTot += (values[i] - yMean) ** 2;
    }
    const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const confidence = Math.round(Math.max(60, Math.min(95, 60 + rSquared * 35)));

    // Risk level based on predicted value
    const paramKey = param.key === "dissolved_oxygen" ? "dissolved_oxygen" : param.key as string;
    const riskLevel = getRiskLevel(getParamStatus(paramKey, predictedValue));

    predictions.push({
      parameter: param.label,
      currentValue: Math.round(currentValue * 100) / 100,
      predictedValue,
      trend,
      confidence,
      riskLevel,
      horizon,
    });
  }

  return {
    engine: "Demo Forecast Engine (Local)",
    mlConfigured: false,
    horizon,
    predictions,
  };
}
