import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const ML_API_URL = Deno.env.get("ML_API_URL");

// ============================================================
// TYPES
// ============================================================

interface WaterReading {
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  dissolvedOxygen: number;
  conductivity: number;
}

interface ParameterAssessment {
  name: string;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  status: "normal" | "warning" | "critical";
  deviation: number;
  contribution: number;
}

// ============================================================
// WATER QUALITY ANALYSIS ENGINE
// ============================================================

const PARAM_RANGES = {
  ph: { min: 6.5, max: 8.5, ideal: 7.0, label: "pH", unit: "", weight: 20 },
  turbidity: { min: 0, max: 5, ideal: 1, label: "Turbidity", unit: "NTU", weight: 20 },
  temperature: { min: 15, max: 30, ideal: 25, label: "Temperature", unit: "°C", weight: 10 },
  tds: { min: 0, max: 500, ideal: 300, label: "TDS", unit: "ppm", weight: 15 },
  dissolvedOxygen: { min: 5, max: 14, ideal: 8, label: "Dissolved Oxygen", unit: "mg/L", weight: 20 },
  conductivity: { min: 0, max: 600, ideal: 400, label: "Conductivity", unit: "µS/cm", weight: 15 },
};

function analyzeParameter(
  key: keyof typeof PARAM_RANGES,
  value: number
): ParameterAssessment {
  const range = PARAM_RANGES[key];
  let status: "normal" | "warning" | "critical" = "normal";
  let deviation = 0;

  if (key === "ph") {
    deviation = Math.abs(value - range.ideal);
    if (value < 5.5 || value > 9.5) status = "critical";
    else if (value < 6.5 || value > 8.5) status = "warning";
  } else if (key === "turbidity") {
    deviation = Math.max(0, value - range.max);
    if (value > 15) status = "critical";
    else if (value > 5) status = "warning";
  } else if (key === "temperature") {
    deviation = Math.max(0, value - range.max, range.min - value);
    if (value > 35 || value < 10) status = "critical";
    else if (value > 30 || value < 15) status = "warning";
  } else if (key === "tds") {
    deviation = Math.max(0, value - range.max);
    if (value > 800) status = "critical";
    else if (value > 500) status = "warning";
  } else if (key === "dissolvedOxygen") {
    deviation = Math.max(0, range.min - value);
    if (value < 3) status = "critical";
    else if (value < 5) status = "warning";
  } else if (key === "conductivity") {
    deviation = Math.max(0, value - range.max);
    if (value > 1000) status = "critical";
    else if (value > 600) status = "warning";
  }

  // Calculate contribution (0-100 for this parameter)
  let contribution: number;
  if (status === "normal") {
    contribution = 100;
  } else if (status === "warning") {
    contribution = Math.max(50, 100 - deviation * 5);
  } else {
    contribution = Math.max(0, 50 - deviation * 3);
  }

  return {
    name: key,
    label: range.label,
    value,
    unit: range.unit,
    min: range.min,
    max: range.max,
    status,
    deviation: Math.round(deviation * 100) / 100,
    contribution: Math.round(contribution * 100) / 100,
  };
}

function calculateWaterQualityScore(reading: WaterReading): number {
  const params = {
    ph: analyzeParameter("ph", reading.ph),
    turbidity: analyzeParameter("turbidity", reading.turbidity),
    temperature: analyzeParameter("temperature", reading.temperature),
    tds: analyzeParameter("tds", reading.tds),
    dissolvedOxygen: analyzeParameter("dissolvedOxygen", reading.dissolvedOxygen),
    conductivity: analyzeParameter("conductivity", reading.conductivity),
  };

  let totalScore = 0;
  let totalWeight = 0;
  (Object.keys(params) as (keyof typeof params)[]).forEach((key) => {
    const weight = PARAM_RANGES[key as keyof typeof PARAM_RANGES].weight;
    totalScore += params[key].contribution * weight;
    totalWeight += weight;
  });

  return Math.round((totalScore / totalWeight) * 100) / 100;
}

function classifyWaterQuality(score: number): {
  status: string;
  label: string;
  color: string;
} {
  if (score >= 90) return { status: "safe", label: "EXCELLENT", color: "green" };
  if (score >= 75) return { status: "safe", label: "GOOD", color: "green" };
  if (score >= 50) return { status: "warning", label: "WARNING", color: "amber" };
  return { status: "critical", label: "CRITICAL", color: "red" };
}

function generateRecommendations(reading: WaterReading): string[] {
  const recs: string[] = [];
  const params = {
    ph: analyzeParameter("ph", reading.ph),
    turbidity: analyzeParameter("turbidity", reading.turbidity),
    temperature: analyzeParameter("temperature", reading.temperature),
    tds: analyzeParameter("tds", reading.tds),
    dissolvedOxygen: analyzeParameter("dissolvedOxygen", reading.dissolvedOxygen),
    conductivity: analyzeParameter("conductivity", reading.conductivity),
  };

  if (params.ph.status !== "normal") {
    recs.push(
      `pH is ${reading.ph < 7 ? "below" : "above"} the acceptable range. ${
        reading.ph < 7
          ? "Inspect the source for acidic contamination and verify sensor calibration."
          : "Check for alkaline contamination sources and verify chemical dosing levels."
      }`
    );
  }
  if (params.turbidity.status !== "normal") {
    recs.push(
      "Elevated turbidity detected. Inspect the source for sediment, runoff, or contamination."
    );
  }
  if (params.tds.status !== "normal") {
    recs.push(
      "Elevated total dissolved solids detected. Inspect the water source and filtration system."
    );
  }
  if (params.dissolvedOxygen.status !== "normal") {
    recs.push(
      "Low dissolved oxygen may indicate organic contamination or poor water circulation."
    );
  }
  if (params.temperature.status !== "normal") {
    recs.push(
      `Water temperature is ${reading.temperature > 30 ? "above" : "below"} optimal range. Monitor environmental conditions affecting water temperature.`
    );
  }
  if (params.conductivity.status !== "normal") {
    recs.push(
      "Elevated conductivity detected. Check for dissolved salts or mineral contamination."
    );
  }
  if (recs.length === 0) {
    recs.push(
      "All monitored parameters are currently within configured acceptable ranges."
    );
  }
  return recs;
}

function generateAlerts(
  reading: WaterReading,
  stationId: string
): Array<{
  type: string;
  severity: string;
  title: string;
  message: string;
  parameter: string;
  value: number;
  threshold: number;
  recommended_action: string;
}> {
  const alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    parameter: string;
    value: number;
    threshold: number;
    recommended_action: string;
  }> = [];

  const params = {
    ph: analyzeParameter("ph", reading.ph),
    turbidity: analyzeParameter("turbidity", reading.turbidity),
    temperature: analyzeParameter("temperature", reading.temperature),
    tds: analyzeParameter("tds", reading.tds),
    dissolvedOxygen: analyzeParameter("dissolvedOxygen", reading.dissolvedOxygen),
    conductivity: analyzeParameter("conductivity", reading.conductivity),
  };

  const alertConfig: Record<string, { threshold: number; action: string; title: string }> = {
    ph: { threshold: 6.5, action: "Inspect the source for acidic contamination and verify sensor calibration.", title: "pH Out of Range" },
    turbidity: { threshold: 5, action: "Inspect the source for sediment, runoff, or contamination.", title: "High Turbidity Detected" },
    temperature: { threshold: 30, action: "Monitor environmental conditions affecting water temperature.", title: "Temperature Out of Range" },
    tds: { threshold: 500, action: "Inspect the water source and filtration system.", title: "High TDS Detected" },
    dissolvedOxygen: { threshold: 5, action: "Check for organic contamination sources. Improve water circulation and aeration.", title: "Low Dissolved Oxygen" },
    conductivity: { threshold: 600, action: "Check for dissolved salts or mineral contamination.", title: "High Conductivity Detected" },
  };

  (Object.keys(params) as (keyof typeof params)[]).forEach((key) => {
    const p = params[key];
    if (p.status !== "normal") {
      const cfg = alertConfig[key];
      alerts.push({
        type: p.status === "critical" ? "critical" : "warning",
        severity: p.status === "critical" ? "critical" : "warning",
        title: cfg.title,
        message: `${p.label} has reached ${p.value}${p.unit}, ${p.status === "critical" ? "exceeding critical threshold" : "outside acceptable range"} of ${cfg.threshold}.`,
        parameter: key,
        value: p.value,
        threshold: cfg.threshold,
        recommended_action: cfg.action,
      });
    }
  });

  return alerts;
}

// ============================================================
// ANOMALY DETECTION
// ============================================================

interface AnomalyResult {
  parameter: string;
  observedValue: number;
  expectedValue: number;
  severity: string;
  score: number;
  explanation: string;
  possibleCause: string;
  recommendation: string;
}

async function detectAnomalies(
  reading: WaterReading,
  stationId: string,
  readingId: string
): Promise<AnomalyResult[]> {
  // Get recent historical readings for baseline
  const { data: history } = await supabase
    .from("readings")
    .select("ph, turbidity, temperature, tds, dissolved_oxygen, conductivity")
    .eq("station_id", stationId)
    .order("timestamp", { ascending: false })
    .range(1, 50);

  if (!history || history.length < 5) return [];

  const params: Array<{ key: keyof WaterReading; label: string; unit: string }> = [
    { key: "ph", label: "pH", unit: "" },
    { key: "turbidity", label: "Turbidity", unit: "NTU" },
    { key: "temperature", label: "Temperature", unit: "°C" },
    { key: "tds", label: "TDS", unit: "ppm" },
    { key: "dissolvedOxygen", label: "Dissolved Oxygen", unit: "mg/L" },
    { key: "conductivity", label: "Conductivity", unit: "µS/cm" },
  ];

  const anomalies: AnomalyResult[] = [];

  for (const param of params) {
    const values = history.map((h) => h[param.key as keyof typeof h] as number);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
    );

    const observed = reading[param.key];
    const zScore = stdDev > 0 ? Math.abs(observed - mean) / stdDev : 0;

    if (zScore > 2.5) {
      let severity = "low";
      let score = zScore;
      if (zScore > 4) {
        severity = "critical";
        score = zScore * 1.2;
      } else if (zScore > 3.5) {
        severity = "high";
        score = zScore * 1.1;
      } else if (zScore > 2.5) {
        severity = "medium";
      }

      const causes: Record<string, string> = {
        ph: "Possible acidic or alkaline contamination, chemical discharge, or sensor drift",
        turbidity: "Sudden contamination, sediment disturbance, or sensor issue",
        temperature: "Environmental temperature change, industrial discharge, or equipment malfunction",
        tds: "Mineral contamination, industrial discharge, or filtration system failure",
        dissolvedOxygen: "Organic contamination, algae bloom, or poor water circulation",
        conductivity: "Dissolved salt increase, mineral contamination, or industrial discharge",
      };

      const recs: Record<string, string> = {
        ph: "Inspect the water source for contamination. Verify sensor calibration.",
        turbidity: "Inspect the source for sediment, runoff, or contamination.",
        temperature: "Check environmental conditions and potential heat sources.",
        tds: "Inspect the water source and filtration system.",
        dissolvedOxygen: "Check for organic contamination. Improve water circulation.",
        conductivity: "Check for dissolved salts or mineral contamination sources.",
      };

      anomalies.push({
        parameter: param.label,
        observedValue: Math.round(observed * 100) / 100,
        expectedValue: Math.round(mean * 100) / 100,
        severity,
        score: Math.round(score * 100) / 100,
        explanation: `${param.label} value of ${observed}${param.unit} deviates significantly from the expected value of ${Math.round(mean * 100) / 100}${param.unit} (z-score: ${Math.round(zScore * 100) / 100})`,
        possibleCause: causes[param.key],
        recommendation: recs[param.key],
      });

      // Store anomaly in database
      await supabase.from("anomalies").insert({
        station_id: stationId,
        reading_id: readingId,
        parameter: param.label,
        observed_value: observed,
        expected_value: mean,
        severity,
        score: Math.round(score * 100) / 100,
        explanation: `${param.label} value of ${observed}${param.unit} deviates significantly from the expected value of ${Math.round(mean * 100) / 100}${param.unit}`,
        possible_cause: causes[param.key],
        recommendation: recs[param.key],
        detected_at: new Date().toISOString(),
        resolved: false,
      });
    }
  }

  return anomalies;
}

// ============================================================
// PREDICTION SERVICE (Demo Forecast Engine)
// ============================================================

interface PredictionResult {
  parameter: string;
  currentValue: number;
  predictedValue: number;
  trend: string;
  confidence: number;
  riskLevel: string;
  horizon: string;
}

async function predictWaterQuality(
  stationId: string,
  horizon: string
): Promise<PredictionResult[]> {
  // If ML_API_URL is configured, try to use external ML service
  if (ML_API_URL) {
    try {
      const resp = await fetch(`${ML_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId, horizon }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.predictions) return data.predictions;
      }
    } catch (e) {
      console.log("ML API unavailable, falling back to demo engine");
    }
  }

  // Demo Forecast Engine: trend-based forecasting using historical readings
  const horizonHours = horizon === "6h" ? 6 : horizon === "24h" ? 24 : 168;
  const { data: history } = await supabase
    .from("readings")
    .select("ph, turbidity, temperature, tds, dissolved_oxygen, conductivity, timestamp")
    .eq("station_id", stationId)
    .order("timestamp", { ascending: false })
    .limit(48);

  if (!history || history.length < 5) return [];

  const params: Array<{ key: string; label: string }> = [
    { key: "ph", label: "pH" },
    { key: "turbidity", label: "Turbidity" },
    { key: "temperature", label: "Temperature" },
    { key: "tds", label: "TDS" },
    { key: "dissolved_oxygen", label: "Dissolved Oxygen" },
    { key: "conductivity", label: "Conductivity" },
  ];

  const results: PredictionResult[] = [];

  for (const param of params) {
    const values = history.map((h) => h[param.key as keyof typeof h] as number).reverse();
    const currentValue = values[values.length - 1];

    // Linear regression for trend
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

    // Project forward
    const stepsAhead = horizonHours / 0.5; // readings are every 30 min
    let predictedValue = currentValue + slope * stepsAhead;

    // Add slight mean reversion
    const longTermMean = yMean;
    predictedValue = predictedValue * 0.7 + longTermMean * 0.3;
    predictedValue = Math.round(predictedValue * 100) / 100;

    // Determine trend
    const trendThreshold = Math.abs(yMean) * 0.02;
    let trend = "stable";
    if (slope > trendThreshold) trend = "increasing";
    else if (slope < -trendThreshold) trend = "decreasing";

    // Calculate confidence based on R²
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < n; i++) {
      const predicted = yMean + slope * (i - xMean);
      ssRes += (values[i] - predicted) ** 2;
      ssTot += (values[i] - yMean) ** 2;
    }
    const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
    const confidence = Math.round(Math.max(60, Math.min(98, 60 + rSquared * 38)));

    // Risk level based on predicted value
    let riskLevel = "low";
    const paramAssessment = analyzeParameter(
      param.key === "dissolved_oxygen" ? "dissolvedOxygen" : param.key as keyof typeof PARAM_RANGES,
      predictedValue
    );
    if (paramAssessment.status === "critical") riskLevel = "high";
    else if (paramAssessment.status === "warning") riskLevel = "medium";

    results.push({
      parameter: param.label,
      currentValue: Math.round(currentValue * 100) / 100,
      predictedValue,
      trend,
      confidence,
      riskLevel,
      horizon,
    });

    // Store prediction in database
    await supabase.from("predictions").insert({
      station_id: stationId,
      parameter: param.label,
      current_value: Math.round(currentValue * 100) / 100,
      predicted_value: predictedValue,
      prediction_horizon: horizon,
      confidence,
      risk_level: riskLevel,
      trend,
    });
  }

  return results;
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

async function handleAnalyze(body: WaterReading & { stationId?: string }) {
  // Validate input
  const required = ["ph", "turbidity", "temperature", "tds", "dissolvedOxygen", "conductivity"];
  for (const field of required) {
    if (body[field as keyof WaterReading] === undefined || body[field as keyof WaterReading] === null) {
      return { status: 400, body: { error: `Missing required field: ${field}` } };
    }
    const val = body[field as keyof WaterReading];
    if (typeof val !== "number" || isNaN(val)) {
      return { status: 400, body: { error: `${field} must be a valid number` } };
    }
  }

  if (body.ph < 0 || body.ph > 14) {
    return { status: 400, body: { error: "pH must be between 0 and 14" } };
  }
  if (body.turbidity < 0) {
    return { status: 400, body: { error: "Turbidity must be a positive value" } };
  }
  if (body.temperature < -50 || body.temperature > 100) {
    return { status: 400, body: { error: "Temperature must be between -50 and 100" } };
  }
  if (body.tds < 0) {
    return { status: 400, body: { error: "TDS must be a positive value" } };
  }
  if (body.dissolvedOxygen < 0) {
    return { status: 400, body: { error: "Dissolved oxygen must be a positive value" } };
  }
  if (body.conductivity < 0) {
    return { status: 400, body: { error: "Conductivity must be a positive value" } };
  }

  const reading: WaterReading = {
    ph: body.ph,
    turbidity: body.turbidity,
    temperature: body.temperature,
    tds: body.tds,
    dissolvedOxygen: body.dissolvedOxygen,
    conductivity: body.conductivity,
  };

  const score = calculateWaterQualityScore(reading);
  const classification = classifyWaterQuality(score);

  const parameters = {
    ph: analyzeParameter("ph", reading.ph),
    turbidity: analyzeParameter("turbidity", reading.turbidity),
    temperature: analyzeParameter("temperature", reading.temperature),
    tds: analyzeParameter("tds", reading.tds),
    dissolvedOxygen: analyzeParameter("dissolvedOxygen", reading.dissolvedOxygen),
    conductivity: analyzeParameter("conductivity", reading.conductivity),
  };

  const recommendations = generateRecommendations(reading);
  const alerts = generateAlerts(reading, body.stationId || "");

  // Store the reading if stationId provided
  let readingId: string | null = null;
  let anomalies: AnomalyResult[] = [];
  if (body.stationId) {
    const { data: inserted } = await supabase
      .from("readings")
      .insert({
        station_id: body.stationId,
        ph: reading.ph,
        turbidity: reading.turbidity,
        temperature: reading.temperature,
        tds: reading.tds,
        dissolved_oxygen: reading.dissolvedOxygen,
        conductivity: reading.conductivity,
        quality_score: score,
        status: classification.status,
        is_anomaly: classification.status === "critical",
      })
      .select("id")
      .single();

    if (inserted) {
      readingId = inserted.id;
      anomalies = await detectAnomalies(reading, body.stationId, inserted.id);
    }

    // Store alerts
    if (alerts.length > 0) {
      await supabase.from("alerts").insert(
        alerts.map((a) => ({
          station_id: body.stationId,
          type: a.type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          parameter: a.parameter,
          value: a.value,
          threshold: a.threshold,
          recommended_action: a.recommended_action,
          is_read: false,
          is_dismissed: false,
        }))
      );
    }
  }

  return {
    status: 200,
    body: {
      qualityScore: score,
      status: classification.status,
      label: classification.label,
      parameters,
      recommendations,
      alerts,
      anomalies,
      readingId,
    },
  };
}

async function handlePredict(body: { stationId: string; horizon: string }) {
  if (!body.stationId) {
    return { status: 400, body: { error: "Missing stationId" } };
  }
  const horizon = body.horizon || "24h";
  const predictions = await predictWaterQuality(body.stationId, horizon);
  return {
    status: 200,
    body: {
      engine: "Demo Forecast Engine",
      mlConfigured: !!ML_API_URL,
      horizon,
      predictions,
    },
  };
}

async function handleDetectAnomalies(body: { stationId: string; reading?: WaterReading }) {
  if (!body.stationId) {
    return { status: 400, body: { error: "Missing stationId" } };
  }

  // Get the latest reading for this station
  let reading = body.reading;
  let readingId: string | null = null;

  if (!reading) {
    const { data: latest } = await supabase
      .from("readings")
      .select("id, ph, turbidity, temperature, tds, dissolved_oxygen, conductivity")
      .eq("station_id", body.stationId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest) {
      return { status: 404, body: { error: "No readings found for station" } };
    }
    reading = {
      ph: latest.ph,
      turbidity: latest.turbidity,
      temperature: latest.temperature,
      tds: latest.tds,
      dissolvedOxygen: latest.dissolved_oxygen,
      conductivity: latest.conductivity,
    };
    readingId = latest.id;
  }

  const anomalies = await detectAnomalies(reading, body.stationId, readingId || "");
  return { status: 200, body: { anomalies } };
}

async function handleGetStations() {
  const { data, error } = await supabase
    .from("stations")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return { status: 500, body: { error: "Failed to fetch stations" } };
  return { status: 200, body: data };
}

async function handleGetReadings(query: URLSearchParams) {
  const stationId = query.get("stationId");
  const limit = parseInt(query.get("limit") || "100");
  let q = supabase
    .from("readings")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);
  if (stationId) q = q.eq("station_id", stationId);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: "Failed to fetch readings" } };
  return { status: 200, body: data };
}

async function handleGetLatestReadings() {
  const { data: stations } = await supabase.from("stations").select("id, name");
  if (!stations) return { status: 500, body: { error: "Failed to fetch stations" } };

  const latest: Record<string, unknown> = {};
  for (const station of stations) {
    const { data } = await supabase
      .from("readings")
      .select("*")
      .eq("station_id", station.id)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();
    latest[station.id] = { stationName: station.name, reading: data };
  }
  return { status: 200, body: latest };
}

async function handleGetAnomalies(query: URLSearchParams) {
  const stationId = query.get("stationId");
  let q = supabase
    .from("anomalies")
    .select("*, stations(name)")
    .order("detected_at", { ascending: false })
    .limit(100);
  if (stationId) q = q.eq("station_id", stationId);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: "Failed to fetch anomalies" } };
  return { status: 200, body: data };
}

async function handleResolveAnomaly(id: string) {
  const { data, error } = await supabase
    .from("anomalies")
    .update({ resolved: true })
    .eq("id", id)
    .select()
    .single();
  if (error) return { status: 500, body: { error: "Failed to resolve anomaly" } };
  return { status: 200, body: data };
}

async function handleGetAlerts(query: URLSearchParams) {
  const stationId = query.get("stationId");
  let q = supabase
    .from("alerts")
    .select("*, stations(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (stationId) q = q.eq("station_id", stationId);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: "Failed to fetch alerts" } };
  return { status: 200, body: data };
}

async function handleMarkAlertRead(id: string) {
  const { data, error } = await supabase
    .from("alerts")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();
  if (error) return { status: 500, body: { error: "Failed to mark alert as read" } };
  return { status: 200, body: data };
}

async function handleDismissAlert(id: string) {
  const { data, error } = await supabase
    .from("alerts")
    .update({ is_dismissed: true, is_read: true })
    .eq("id", id)
    .select()
    .single();
  if (error) return { status: 500, body: { error: "Failed to dismiss alert" } };
  return { status: 200, body: data };
}

async function handleGetPredictions(stationId: string, query: URLSearchParams) {
  const horizon = query.get("horizon") || "24h";
  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("station_id", stationId)
    .eq("prediction_horizon", horizon)
    .order("timestamp", { ascending: false })
    .limit(6);
  if (error) return { status: 500, body: { error: "Failed to fetch predictions" } };
  return { status: 200, body: data };
}

async function handleCreateStation(body: { name: string; location: string }) {
  if (!body.name || !body.location) {
    return { status: 400, body: { error: "Name and location are required" } };
  }
  const { data, error } = await supabase
    .from("stations")
    .insert({ name: body.name, location: body.location, status: "online", sensor_health: "good" })
    .select()
    .single();
  if (error) return { status: 500, body: { error: "Failed to create station" } };
  return { status: 201, body: data };
}

async function handleCreateReading(body: {
  stationId: string;
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  dissolvedOxygen: number;
  conductivity: number;
}) {
  // Validate
  if (!body.stationId) return { status: 400, body: { error: "Missing stationId" } };
  const reading: WaterReading = {
    ph: body.ph,
    turbidity: body.turbidity,
    temperature: body.temperature,
    tds: body.tds,
    dissolvedOxygen: body.dissolvedOxygen,
    conductivity: body.conductivity,
  };

  for (const [key, val] of Object.entries(reading)) {
    if (val === undefined || val === null || typeof val !== "number" || isNaN(val)) {
      return { status: 400, body: { error: `${key} must be a valid number` } };
    }
  }
  if (reading.ph < 0 || reading.ph > 14) {
    return { status: 400, body: { error: "pH must be between 0 and 14" } };
  }

  const score = calculateWaterQualityScore(reading);
  const classification = classifyWaterQuality(score);

  const { data, error } = await supabase
    .from("readings")
    .insert({
      station_id: body.stationId,
      ph: reading.ph,
      turbidity: reading.turbidity,
      temperature: reading.temperature,
      tds: reading.tds,
      dissolved_oxygen: reading.dissolvedOxygen,
      conductivity: reading.conductivity,
      quality_score: score,
      status: classification.status,
      is_anomaly: classification.status === "critical",
    })
    .select("id")
    .single();

  if (error) return { status: 500, body: { error: "Failed to store reading" } };

  // Detect anomalies for this new reading
  const anomalies = await detectAnomalies(reading, body.stationId, data.id);

  // Generate and store alerts
  const alerts = generateAlerts(reading, body.stationId);
  if (alerts.length > 0) {
    await supabase.from("alerts").insert(
      alerts.map((a) => ({
        station_id: body.stationId,
        type: a.type,
        severity: a.severity,
        title: a.title,
        message: a.message,
        parameter: a.parameter,
        value: a.value,
        threshold: a.threshold,
        recommended_action: a.recommended_action,
        is_read: false,
        is_dismissed: false,
      }))
    );
  }

  return {
    status: 201,
    body: {
      id: data.id,
      qualityScore: score,
      status: classification.status,
      label: classification.label,
      anomalies,
      alertsGenerated: alerts.length,
    },
  };
}

async function handleCreateReport(body: {
  stationId: string;
  startDate: string;
  endDate: string;
}) {
  if (!body.stationId || !body.startDate || !body.endDate) {
    return { status: 400, body: { error: "stationId, startDate, and endDate are required" } };
  }

  const { data: station } = await supabase
    .from("stations")
    .select("*")
    .eq("id", body.stationId)
    .maybeSingle();

  if (!station) return { status: 404, body: { error: "Station not found" } };

  const { data: readings } = await supabase
    .from("readings")
    .select("*")
    .eq("station_id", body.stationId)
    .gte("timestamp", body.startDate)
    .lte("timestamp", body.endDate)
    .order("timestamp", { ascending: true });

  const { data: anomalies } = await supabase
    .from("anomalies")
    .select("*")
    .eq("station_id", body.stationId)
    .gte("detected_at", body.startDate)
    .lte("detected_at", body.endDate)
    .order("detected_at", { ascending: false });

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("station_id", body.stationId)
    .gte("created_at", body.startDate)
    .lte("created_at", body.endDate)
    .order("created_at", { ascending: false });

  const { data: predictions } = await supabase
    .from("predictions")
    .select("*")
    .eq("station_id", body.stationId)
    .order("timestamp", { ascending: false })
    .limit(6);

  // Calculate stats
  const scores = (readings || []).map((r) => r.quality_score);
  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const minScore = scores.length > 0 ? Math.min(...scores) : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const classification = classifyWaterQuality(avgScore);

  const reportData = {
    station,
    period: { start: body.startDate, end: body.endDate },
    summary: {
      totalReadings: readings?.length || 0,
      totalAnomalies: anomalies?.length || 0,
      totalAlerts: alerts?.length || 0,
      averageScore: Math.round(avgScore * 100) / 100,
      minScore: Math.round(minScore * 100) / 100,
      maxScore: Math.round(maxScore * 100) / 100,
      overallStatus: classification.status,
      overallLabel: classification.label,
    },
    readings: readings || [],
    anomalies: anomalies || [],
    alerts: alerts || [],
    predictions: predictions || [],
    recommendations: readings && readings.length > 0
      ? generateRecommendations({
          ph: readings[readings.length - 1].ph,
          turbidity: readings[readings.length - 1].turbidity,
          temperature: readings[readings.length - 1].temperature,
          tds: readings[readings.length - 1].tds,
          dissolvedOxygen: readings[readings.length - 1].dissolved_oxygen,
          conductivity: readings[readings.length - 1].conductivity,
        })
      : ["No readings available for the selected period."],
  };

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      station_id: body.stationId,
      start_date: body.startDate,
      end_date: body.endDate,
      summary: `Water quality assessment for ${station.name} from ${body.startDate} to ${body.endDate}. Average score: ${Math.round(avgScore * 100) / 100}. Status: ${classification.label}.`,
      overall_score: Math.round(avgScore * 100) / 100,
      overall_status: classification.status,
      report_data: reportData,
    })
    .select("id, generated_at")
    .single();

  if (error) return { status: 500, body: { error: "Failed to generate report" } };

  return { status: 201, body: { reportId: report.id, generatedAt: report.generated_at, reportData } };
}

async function handleGetReports(query: URLSearchParams) {
  const stationId = query.get("stationId");
  let q = supabase
    .from("reports")
    .select("id, station_id, start_date, end_date, generated_at, summary, overall_score, overall_status, stations(name)")
    .order("generated_at", { ascending: false })
    .limit(50);
  if (stationId) q = q.eq("station_id", stationId);
  const { data, error } = await q;
  if (error) return { status: 500, body: { error: "Failed to fetch reports" } };
  return { status: 200, body: data };
}

async function handleGetReport(id: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*, stations(name, location)")
    .eq("id", id)
    .maybeSingle();
  if (error) return { status: 500, body: { error: "Failed to fetch report" } };
  if (!data) return { status: 404, body: { error: "Report not found" } };
  return { status: 200, body: data };
}

// ============================================================
// MAIN SERVER
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/functions/v1/aquaguard-api", "");
    const method = req.method;
    const query = url.searchParams;

    let result: { status: number; body: unknown };

    // ROUTES
    if (path === "/api/analyze" && method === "POST") {
      result = await handleAnalyze(await req.json());
    } else if (path === "/api/predict" && method === "POST") {
      result = await handlePredict(await req.json());
    } else if (path === "/api/anomalies/detect" && method === "POST") {
      result = await handleDetectAnomalies(await req.json());
    } else if (path === "/api/stations" && method === "GET") {
      result = await handleGetStations();
    } else if (path === "/api/stations" && method === "POST") {
      result = await handleCreateStation(await req.json());
    } else if (path === "/api/readings" && method === "GET") {
      result = await handleGetReadings(query);
    } else if (path === "/api/readings/latest" && method === "GET") {
      result = await handleGetLatestReadings();
    } else if (path === "/api/readings" && method === "POST") {
      result = await handleCreateReading(await req.json());
    } else if (path === "/api/anomalies" && method === "GET") {
      result = await handleGetAnomalies(query);
    } else if (path.match(/^\/api\/anomalies\/[^/]+\/resolve$/) && method === "PUT") {
      const id = path.split("/")[3];
      result = await handleResolveAnomaly(id);
    } else if (path === "/api/alerts" && method === "GET") {
      result = await handleGetAlerts(query);
    } else if (path.match(/^\/api\/alerts\/[^/]+\/read$/) && method === "PUT") {
      const id = path.split("/")[3];
      result = await handleMarkAlertRead(id);
    } else if (path.match(/^\/api\/alerts\/[^/]+\/dismiss$/) && method === "PUT") {
      const id = path.split("/")[3];
      result = await handleDismissAlert(id);
    } else if (path.match(/^\/api\/predictions\/[^/]+$/) && method === "GET") {
      const stationId = path.split("/")[3];
      result = await handleGetPredictions(stationId, query);
    } else if (path === "/api/reports/generate" && method === "POST") {
      result = await handleCreateReport(await req.json());
    } else if (path === "/api/reports" && method === "GET") {
      result = await handleGetReports(query);
    } else if (path.match(/^\/api\/reports\/[^/]+$/) && method === "GET") {
      const id = path.split("/")[3];
      result = await handleGetReport(id);
    } else {
      result = { status: 404, body: { error: "Endpoint not found" } };
    }

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", message: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
