import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Droplet,
  Cloud,
  Thermometer,
  Beaker,
  Waves,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  Radio,
  Database,
  Cpu,
  ShieldCheck,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { useApp, type DemoScenario } from "@/context/AppContext";
import { Card, Badge, Button, LoadingState, StatusDot } from "@/components/ui";
import {
  STATUS_COLORS,
  getScoreColor,
  getScoreLabel,
  formatTimestamp,
  timeAgo,
} from "@/utils/format";
import type { Reading } from "@/types";

const PARAM_CARDS = [
  { key: "ph", label: "pH", unit: "", icon: Droplet, color: "#06b6d4", range: "6.5 - 8.5" },
  { key: "turbidity", label: "Turbidity", unit: "NTU", icon: Cloud, color: "#f59e0b", range: "0 - 5" },
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer, color: "#ef4444", range: "15 - 30" },
  { key: "tds", label: "TDS", unit: "ppm", icon: Beaker, color: "#8b5cf6", range: "0 - 500" },
  { key: "dissolved_oxygen", label: "Dissolved Oxygen", unit: "mg/L", icon: Waves, color: "#10b981", range: "5 - 14" },
  { key: "conductivity", label: "Conductivity", unit: "µS/cm", icon: Zap, color: "#3b82f6", range: "0 - 600" },
] as const;

function getParamStatus(key: string, value: number): "normal" | "warning" | "critical" {
  if (key === "ph") {
    if (value < 5.5 || value > 9.5) return "critical";
    if (value < 6.5 || value > 8.5) return "warning";
    return "normal";
  }
  if (key === "turbidity") {
    if (value > 15) return "critical";
    if (value > 5) return "warning";
    return "normal";
  }
  if (key === "temperature") {
    if (value > 35 || value < 10) return "critical";
    if (value > 30 || value < 15) return "warning";
    return "normal";
  }
  if (key === "tds") {
    if (value > 800) return "critical";
    if (value > 500) return "warning";
    return "normal";
  }
  if (key === "dissolved_oxygen") {
    if (value < 3) return "critical";
    if (value < 5) return "warning";
    return "normal";
  }
  if (key === "conductivity") {
    if (value > 1000) return "critical";
    if (value > 600) return "warning";
    return "normal";
  }
  return "normal";
}

function getTrend(readings: Reading[], key: keyof Reading): { direction: string; icon: typeof TrendingUp } {
  if (readings.length < 2) return { direction: "stable", icon: Minus };
  const recent = readings.slice(0, 5).reverse();
  if (recent.length < 2) return { direction: "stable", icon: Minus };
  const first = recent[0][key] as number;
  const last = recent[recent.length - 1][key] as number;
  const diff = last - first;
  const threshold = Math.abs(first) * 0.02;
  if (diff > threshold) return { direction: "increasing", icon: TrendingUp };
  if (diff < -threshold) return { direction: "decreasing", icon: TrendingDown };
  return { direction: "stable", icon: Minus };
}

const TREND_COLORS: Record<string, string> = {
  increasing: "text-red-400",
  decreasing: "text-sky-400",
  stable: "text-slate-400",
};

export default function Dashboard() {
  const {
    selectedStation,
    readings,
    latestReading,
    loading,
    error,
    demoMode,
    demoScenario,
    setDemoScenario,
    systemHealth,
  } = useApp();

  const [selectedParam, setSelectedParam] = useState<string | null>(null);

  const chartData = useMemo(() => {
    return readings
      .slice(0, 48)
      .reverse()
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        score: r.quality_score,
        ph: r.ph,
        turbidity: r.turbidity,
        temperature: r.temperature,
        tds: r.tds,
        dissolved_oxygen: r.dissolved_oxygen,
        conductivity: r.conductivity,
      }));
  }, [readings]);

  if (loading) return <LoadingState message="Loading dashboard..." />;
  if (!latestReading) return <LoadingState message="Waiting for sensor data..." />;

  const score = latestReading.quality_score;
  const status = latestReading.status;
  const statusColors = STATUS_COLORS[status];
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  const scoreData = [{ name: "score", value: score, fill: scoreColor }];

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Water Quality Overview</h1>
          <p className="text-sm text-slate-400">
            {selectedStation?.name} · Last updated {timeAgo(latestReading.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors.badge}>
            <StatusDot status={status} />
            {scoreLabel}
          </Badge>
        </div>
      </div>

      {/* Demo Mode Controls */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className={demoMode ? "animate-pulse text-cyan-400" : "text-slate-500"} />
            <div>
              <p className="text-sm font-semibold text-white">Demo Mode</p>
              <p className="text-xs text-slate-400">
                {demoMode ? `Active — ${demoScenario} scenario` : "Simulate sensor readings"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={demoScenario === "healthy" ? "primary" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "healthy" ? "off" : "healthy")}
            >
              Healthy Water
            </Button>
            <Button
              size="sm"
              variant={demoScenario === "warning" ? "primary" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "warning" ? "off" : "warning")}
            >
              Warning Condition
            </Button>
            <Button
              size="sm"
              variant={demoScenario === "contamination" ? "danger" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "contamination" ? "off" : "contamination")}
            >
              Contamination Event
            </Button>
            {demoMode && (
              <Button size="sm" variant="ghost" onClick={() => setDemoScenario("off")}>
                Stop
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Score + Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score Gauge */}
        <Card className="p-6">
          <h3 className="mb-4 text-sm font-medium text-slate-400">Overall Quality Score</h3>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                data={scoreData}
                innerRadius="70%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: scoreColor }}>
                {score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">out of 100</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Badge className={statusColors.badge}>{scoreLabel}</Badge>
            <p className="mt-2 text-xs text-slate-500">
              Composite index — not a substitute for regulatory certification
            </p>
          </div>
        </Card>

        {/* Score Trend Chart */}
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Quality Score Trend</h3>
            <Link to="/monitoring" className="text-xs text-cyan-400 hover:text-cyan-300">
              View Live Monitoring →
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={scoreColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={scoreColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={scoreColor}
                strokeWidth={2}
                fill="url(#scoreGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARAM_CARDS.map((param) => {
          const Icon = param.icon;
          const value = (latestReading as unknown as Record<string, number>)[param.key];
          const paramStatus = getParamStatus(param.key, value);
          const trend = getTrend(readings, param.key as keyof Reading);
          const TrendIcon = trend.icon;

          const statusBadge = {
            normal: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
            warning: "bg-amber-500/20 text-amber-300 border-amber-500/30",
            critical: "bg-red-500/20 text-red-300 border-red-500/30",
          };

          return (
            <Card
              key={param.key}
              className="p-5"
              onClick={() => setSelectedParam(selectedParam === param.key ? null : param.key)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${param.color}20` }}
                  >
                    <Icon size={18} style={{ color: param.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{param.label}</p>
                    <p className="text-lg font-bold text-white">
                      {value.toFixed(1)}
                      <span className="ml-1 text-xs font-normal text-slate-400">{param.unit}</span>
                    </p>
                  </div>
                </div>
                <Badge className={statusBadge[paramStatus]}>
                  {paramStatus.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">Range: {param.range}</span>
                <span className={`flex items-center gap-1 ${TREND_COLORS[trend.direction]}`}>
                  <TrendIcon size={12} />
                  {trend.direction}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Health */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-400">System Health</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Sensor Connectivity", value: systemHealth.sensorConnectivity, icon: Radio, color: "text-emerald-400" },
            { label: "Data Pipeline", value: systemHealth.dataPipeline, icon: Database, color: "text-emerald-400" },
            { label: "Analysis Engine", value: systemHealth.analysisEngine, icon: Cpu, color: "text-cyan-400" },
            { label: "Prediction Engine", value: systemHealth.predictionEngine, icon: Activity, color: "text-cyan-400" },
            { label: "Database", value: systemHealth.database, icon: Database, color: "text-emerald-400" },
            { label: "Last Sync", value: systemHealth.lastSync, icon: Clock, color: "text-slate-300" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col gap-1.5">
                <Icon size={16} className={item.color} />
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className={`text-sm font-semibold ${item.color}`}>{item.value}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Live Monitoring", desc: "Real-time charts", path: "/monitoring", icon: Activity },
          { label: "AI Prediction", desc: "Forecast water quality", path: "/prediction", icon: TrendingUp },
          { label: "Anomalies", desc: "Detection overview", path: "/anomalies", icon: AlertTriangle },
          { label: "Reports", desc: "Generate PDF reports", path: "/reports", icon: ShieldCheck },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path}>
              <Card className="group p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{link.label}</p>
                      <p className="text-xs text-slate-500">{link.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-slate-400" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Parameter Detail Modal */}
      {selectedParam && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {PARAM_CARDS.find((p) => p.key === selectedParam)?.label} — Recent Readings
            </h3>
            <Button size="sm" variant="ghost" onClick={() => setSelectedParam(null)}>Close</Button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`grad-${selectedParam}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PARAM_CARDS.find((p) => p.key === selectedParam)?.color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PARAM_CARDS.find((p) => p.key === selectedParam)?.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15,23,42,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedParam}
                stroke={PARAM_CARDS.find((p) => p.key === selectedParam)?.color}
                strokeWidth={2}
                fill={`url(#grad-${selectedParam})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
