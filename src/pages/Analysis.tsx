import { useState } from "react";
import {
  FlaskConical,
  Droplet,
  Cloud,
  Thermometer,
  Beaker,
  Waves,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, Button, Badge, LoadingState } from "@/components/ui";
import { analyzeWater } from "@/services/api";
import {
  STATUS_COLORS,
  getScoreColor,
  getScoreLabel,
} from "@/utils/format";
import type { AnalysisResult } from "@/types";

const PARAM_FIELDS = [
  { key: "ph", label: "pH", unit: "", icon: Droplet, placeholder: "7.0", min: 0, max: 14 },
  { key: "turbidity", label: "Turbidity", unit: "NTU", icon: Cloud, placeholder: "2.5", min: 0, max: 100 },
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, placeholder: "25.0", min: -50, max: 100 },
  { key: "tds", label: "TDS", unit: "ppm", icon: Beaker, placeholder: "300", min: 0, max: 2000 },
  { key: "dissolvedOxygen", label: "Dissolved Oxygen", unit: "mg/L", icon: Waves, placeholder: "7.5", min: 0, max: 20 },
  { key: "conductivity", label: "Conductivity", unit: "µS/cm", icon: Zap, placeholder: "450", min: 0, max: 2000 },
] as const;

const SAMPLE_DATA = {
  ph: "7.2",
  turbidity: "2.1",
  temperature: "25.5",
  tds: "310",
  dissolvedOxygen: "7.8",
  conductivity: "450",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  normal: CheckCircle2,
  warning: AlertTriangle,
  critical: AlertCircle,
};

const STATUS_COLORS_MAP: Record<string, string> = {
  normal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  critical: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function Analysis() {
  const { selectedStation } = useApp();
  const [values, setValues] = useState<Record<string, string>>({
    ph: "",
    turbidity: "",
    temperature: "",
    tds: "",
    dissolvedOxygen: "",
    conductivity: "",
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        stationId: selectedStation?.id,
        ph: parseFloat(values.ph) || 0,
        turbidity: parseFloat(values.turbidity) || 0,
        temperature: parseFloat(values.temperature) || 0,
        tds: parseFloat(values.tds) || 0,
        dissolvedOxygen: parseFloat(values.dissolvedOxygen) || 0,
        conductivity: parseFloat(values.conductivity) || 0,
      };
      const res = await analyzeWater(params);
      setResult(res);
    } catch (err) {
      setError("Unable to analyze water quality. Please check your inputs and try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setValues(SAMPLE_DATA);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Water Quality Analysis</h1>
        <p className="text-sm text-slate-400">
          Enter sensor readings to analyze water quality and detect issues
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <FlaskConical size={16} className="text-cyan-400" />
              Input Parameters
            </h3>
            <Button size="sm" variant="ghost" onClick={loadSample}>
              Load Sample Data
            </Button>
          </div>
          <div className="space-y-4">
            {PARAM_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key}>
                  <label className="mb-1.5 flex items-center gap-2 text-sm text-slate-300">
                    <Icon size={14} className="text-slate-400" />
                    {field.label}
                    <span className="text-xs text-slate-500">({field.unit || "N/A"})</span>
                  </label>
                  <input
                    type="number"
                    value={values[field.key]}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step="0.1"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500/50"
                  />
                </div>
              );
            })}
          </div>
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-4 w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Water Quality"
            )}
          </Button>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {!result && !loading && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <FlaskConical size={32} className="mb-3 text-slate-600" />
                <p className="text-sm font-medium text-slate-400">No analysis yet</p>
                <p className="text-xs text-slate-500">Enter parameters and click Analyze</p>
              </div>
            </Card>
          )}

          {loading && <LoadingState message="Analyzing water quality..." />}

          {result && !loading && (
            <>
              {/* Score */}
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Overall Quality Score</p>
                    <p className="text-3xl font-bold" style={{ color: getScoreColor(result.qualityScore) }}>
                      {result.qualityScore.toFixed(1)}
                    </p>
                  </div>
                  <Badge className={STATUS_COLORS[result.status].badge}>
                    {getScoreLabel(result.qualityScore)}
                  </Badge>
                </div>
              </Card>

              {/* Parameter Breakdown */}
              <Card className="p-6">
                <h4 className="mb-3 text-sm font-semibold text-white">Parameter Breakdown</h4>
                <div className="space-y-3">
                  {Object.values(result.parameters).map((param) => {
                    const Icon = STATUS_ICONS[param.status];
                    return (
                      <div key={param.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={
                            param.status === "normal" ? "text-emerald-400" :
                            param.status === "warning" ? "text-amber-400" : "text-red-400"
                          } />
                          <div>
                            <p className="text-sm font-medium text-white">{param.label}</p>
                            <p className="text-xs text-slate-500">
                              {param.value}{param.unit} · Range: {param.min}-{param.max}{param.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={STATUS_COLORS_MAP[param.status]}>
                            {param.status.toUpperCase()}
                          </Badge>
                          <p className="mt-1 text-xs text-slate-500">
                            Score: {param.contribution.toFixed(0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Detected Issues */}
              {result.anomalies.length > 0 && (
                <Card className="p-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <AlertTriangle size={16} className="text-amber-400" />
                    Detected Issues ({result.anomalies.length})
                  </h4>
                  <div className="space-y-2">
                    {result.anomalies.map((a, i) => (
                      <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{a.parameter}</p>
                          <Badge className={STATUS_COLORS_MAP[a.severity] || STATUS_COLORS_MAP.warning}>
                            {a.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{a.explanation}</p>
                        <p className="mt-1 text-xs text-slate-500">Cause: {a.possibleCause}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Recommendations */}
              <Card className="p-6">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Lightbulb size={16} className="text-cyan-400" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
