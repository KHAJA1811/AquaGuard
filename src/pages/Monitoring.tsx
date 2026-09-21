import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Droplet, Cloud, Thermometer, Beaker, Waves, Zap } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, LoadingState, Badge } from "@/components/ui";
import { formatTimestamp } from "@/utils/format";

const TIME_FILTERS = [
  { label: "1 Hour", hours: 1 },
  { label: "6 Hours", hours: 6 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days", hours: 168 },
  { label: "30 Days", hours: 720 },
];

const CHART_CONFIG = [
  { key: "ph", label: "pH", unit: "", color: "#06b6d4", icon: Droplet, range: [0, 14] },
  { key: "turbidity", label: "Turbidity", unit: "NTU", color: "#f59e0b", icon: Cloud, range: [0, 30] },
  { key: "temperature", label: "Temperature", unit: "°C", color: "#ef4444", icon: Thermometer, range: [10, 40] },
  { key: "tds", label: "TDS", unit: "ppm", color: "#8b5cf6", icon: Beaker, range: [0, 1000] },
  { key: "dissolved_oxygen", label: "Dissolved Oxygen", unit: "mg/L", color: "#10b981", icon: Waves, range: [0, 14] },
  { key: "conductivity", label: "Conductivity", unit: "µS/cm", color: "#3b82f6", icon: Zap, range: [0, 1200] },
] as const;

export default function Monitoring() {
  const { readings, loading, error, selectedStation } = useApp();
  const [timeFilter, setTimeFilter] = useState(24);

  const filteredReadings = useMemo(() => {
    const cutoff = Date.now() - timeFilter * 60 * 60 * 1000;
    return readings
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .reverse()
      .map((r) => ({
        time: new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        fullTime: formatTimestamp(r.timestamp),
        ph: r.ph,
        turbidity: r.turbidity,
        temperature: r.temperature,
        tds: r.tds,
        dissolved_oxygen: r.dissolved_oxygen,
        conductivity: r.conductivity,
        score: r.quality_score,
      }));
  }, [readings, timeFilter]);

  if (loading) return <LoadingState message="Loading monitoring data..." />;

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
          <h1 className="text-2xl font-bold text-white">Live Monitoring</h1>
          <p className="text-sm text-slate-400">
            {selectedStation?.name} · {filteredReadings.length} readings in range
          </p>
        </div>
        {/* Time filters */}
        <div className="flex flex-wrap gap-2">
          {TIME_FILTERS.map((filter) => (
            <button
              key={filter.hours}
              onClick={() => setTimeFilter(filter.hours)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                timeFilter === filter.hours
                  ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {CHART_CONFIG.map((config) => {
          const Icon = config.icon;
          return (
            <Card key={config.key} className="p-5">
              <div className="mb-4 flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon size={16} style={{ color: config.color }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{config.label}</h3>
                  <p className="text-xs text-slate-500">Unit: {config.unit || "N/A"}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={filteredReadings}>
                  <defs>
                    <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={config.color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={config.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={config.range as [number, number]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={config.key}
                    stroke={config.color}
                    strokeWidth={2}
                    fill={`url(#grad-${config.key})`}
                    name={config.label}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          );
        })}
      </div>

      {/* Quality Score Line Chart */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Overall Quality Score</h3>
          <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            Composite Index
          </Badge>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={filteredReadings}>
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
            <Line
              type="monotone"
              dataKey="score"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Quality Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
