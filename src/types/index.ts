export type WaterStatus = "safe" | "warning" | "critical";
export type Severity = "low" | "medium" | "high" | "critical";
export type UserRole = "admin" | "operator" | "viewer";

export interface Station {
  id: string;
  name: string;
  location: string;
  status: string;
  sensor_health: string;
  last_sync: string;
  created_at: string;
}

export interface Reading {
  id: string;
  station_id: string;
  timestamp: string;
  ph: number;
  turbidity: number;
  temperature: number;
  tds: number;
  dissolved_oxygen: number;
  conductivity: number;
  quality_score: number;
  status: WaterStatus;
  is_anomaly: boolean;
}

export interface Anomaly {
  id: string;
  station_id: string;
  reading_id: string | null;
  parameter: string;
  observed_value: number;
  expected_value: number;
  severity: Severity;
  score: number;
  explanation: string;
  possible_cause: string;
  recommendation: string;
  detected_at: string;
  resolved: boolean;
  stations?: { name: string };
}

export interface Alert {
  id: string;
  station_id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  parameter: string | null;
  value: number | null;
  threshold: number | null;
  recommended_action: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  stations?: { name: string };
}

export interface Prediction {
  id: string;
  station_id: string;
  timestamp: string;
  parameter: string;
  current_value: number;
  predicted_value: number;
  prediction_horizon: string;
  confidence: number;
  risk_level: string;
  trend: string;
}

export interface Report {
  id: string;
  station_id: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  summary: string;
  overall_score: number;
  overall_status: string;
  report_data: ReportData;
  stations?: { name: string; location: string };
}

export interface ReportData {
  station: Station;
  period: { start: string; end: string };
  summary: {
    totalReadings: number;
    totalAnomalies: number;
    totalAlerts: number;
    averageScore: number;
    minScore: number;
    maxScore: number;
    overallStatus: string;
    overallLabel: string;
  };
  readings: Reading[];
  anomalies: Anomaly[];
  alerts: Alert[];
  predictions: Prediction[];
  recommendations: string[];
}

export interface ParameterAssessment {
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

export interface AnalysisResult {
  qualityScore: number;
  status: WaterStatus;
  label: string;
  parameters: {
    ph: ParameterAssessment;
    turbidity: ParameterAssessment;
    temperature: ParameterAssessment;
    tds: ParameterAssessment;
    dissolvedOxygen: ParameterAssessment;
    conductivity: ParameterAssessment;
  };
  recommendations: string[];
  alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    parameter: string;
    value: number;
    threshold: number;
    recommended_action: string;
  }>;
  anomalies: Array<{
    parameter: string;
    observedValue: number;
    expectedValue: number;
    severity: string;
    score: number;
    explanation: string;
    possibleCause: string;
    recommendation: string;
  }>;
  readingId: string | null;
}

export interface PredictionResult {
  parameter: string;
  currentValue: number;
  predictedValue: number;
  trend: string;
  confidence: number;
  riskLevel: string;
  horizon: string;
}

export interface PredictionResponse {
  engine: string;
  mlConfigured: boolean;
  horizon: string;
  predictions: PredictionResult[];
}
