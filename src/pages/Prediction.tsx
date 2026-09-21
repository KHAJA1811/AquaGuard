import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Cpu,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { Card, Button, Badge, LoadingState } from "@/components/ui";
import { predictWater } from "@/services/api";
import { getScoreColor } from "@/utils/format";
import type { PredictionResult, PredictionResponse } from "@/types";

const HORIZONS = [
  { label: "6 Hours", value: "6h" },
  { label: "24 Hours", value: "24h" },
  { label: "7 Days", value: "7d" },
];

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
};

const TREND_COLORS: Record<string, string> = {
  increasing: "#ef4444",
  decreasing: "#3b82f6",
  stable: "#64748b",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  high: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function Prediction() {
  const { selectedStation, readings, loading, error } = useApp();
  const [horizon, setHorizon] = useState("24h");
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [engineInfo, setEngineInfo] = useState<PredictionResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  const runPrediction = async () => {
    if (!selectedStation) return;
    setPredicting(true);
    try {
      const res = await predictWater(selectedStation.id, horizon);
      setPredictions(res.predictions);
      setEngineInfo(res);
    } catch {
      // predictWater now has its own fallback — this should never happen
      setPredictions([]);
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    if (selectedStation) {
      runPrediction();
    }
  }, [selectedStation, horizon]);

  const chartData = predictions.map((p) => ({
    parameter: p.parameter,
    current: p.currentValue,
    predicted: p.predictedValue,
  }));

  if (loading) return <LoadingState message="Loading prediction data..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Water Quality Prediction</h1>
          <p className="text-sm text-slate-400">
            {selectedStation?.name} · {engineInfo?.engine || "Demo Forecast Engine"}
          </p>
        </div>
        <div className="flex gap-2">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                horizon === h.value
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Info */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Cpu size={18} className="text-cyan-400" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-white">
                {engineInfo?.engine || "Demo Forecast Engine"}
              </p>
              {engineInfo && !engineInfo.mlConfigured && (
                <Badge className="bg-amber-500/15 text-amber-300/80 border-amber-500/20 text-[10px]">
                  <Zap size={10} />
                  LOCAL ESTIMATION
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {engineInfo?.mlConfigured
                ? "Connected to external ML service (ML_API_URL)"
                : "Trend-based forecasting using linear regression with mean reversion. Connect a Python/FastAPI model via ML_API_URL for production use."}
            </p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            {horizon.toUpperCase()}
          </Badge>
        </div>
      </Card>

      {predicting && <LoadingState message="Running predictions..." />}

      {/* Chart */}
      {!predicting && predictions.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-semibold text-white">Current vs Predicted Values</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="parameter" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="current" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Current" />
              <Bar dataKey="predicted" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Predicted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Prediction Cards */}
      {!predicting && predictions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {predictions.map((p, i) => {
            const TrendIcon = TREND_ICONS[p.trend] || Minus;
            const trendColor = TREND_COLORS[p.trend] || TREND_COLORS.stable;
            const change = p.predictedValue - p.currentValue;
            const changePercent = p.currentValue !== 0 ? ((change / p.currentValue) * 100).toFixed(1) : "0";

            return (
              <Card key={i} className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{p.parameter}</h4>
                  <Badge className={RISK_COLORS[p.riskLevel] || RISK_COLORS.low}>
                    {p.riskLevel.toUpperCase()} RISK
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Current</p>
                    <p className="text-lg font-bold text-cyan-300">{p.currentValue}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Predicted</p>
                    <p className="text-lg font-bold text-violet-300">{p.predictedValue}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1.5" style={{ color: trendColor }}>
                    <TrendIcon size={14} />
                    <span className="text-xs capitalize">{p.trend}</span>
                    <span className="text-xs text-slate-500">({changePercent}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Confidence:</span>
                    <span className="text-xs font-semibold" style={{ color: getScoreColor(p.confidence) }}>
                      {p.confidence}%
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!predicting && predictions.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center text-center">
            <TrendingUp size={32} className="mb-3 text-slate-600" />
            <p className="text-sm text-slate-400">Generating predictions...</p>
            <Button size="sm" variant="secondary" className="mt-3" onClick={runPrediction}>
              Run Prediction
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
