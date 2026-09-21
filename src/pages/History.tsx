import { useState, useEffect, useMemo } from "react";
import {
  History as HistoryIcon,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Button, LoadingState } from "@/components/ui";
import { getReadings } from "@/services/api";
import { STATUS_COLORS, formatTimestamp } from "@/utils/format";
import type { Reading } from "@/types";

const PARAMS = [
  { key: "ph", label: "pH", color: "#06b6d4" },
  { key: "turbidity", label: "Turbidity", color: "#f59e0b" },
  { key: "temperature", label: "Temperature", color: "#ef4444" },
  { key: "tds", label: "TDS", color: "#8b5cf6" },
  { key: "dissolved_oxygen", label: "Dissolved Oxygen", color: "#10b981" },
  { key: "conductivity", label: "Conductivity", color: "#3b82f6" },
] as const;

const PAGE_SIZE = 10;

export default function History() {
  const { selectedStation, loading, error } = useApp();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("timestamp");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    (async () => {
      if (!selectedStation) return;
      setHistoryLoading(true);
      try {
        const data = await getReadings(selectedStation.id, 500);
        setReadings(data);
      } catch {
        // silent
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [selectedStation?.id]);

  const filtered = useMemo(() => {
    let result = [...readings];
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.ph.toString().includes(s) ||
          r.turbidity.toString().includes(s) ||
          r.temperature.toString().includes(s) ||
          r.tds.toString().includes(s) ||
          r.dissolved_oxygen.toString().includes(s) ||
          r.conductivity.toString().includes(s) ||
          r.quality_score.toString().includes(s)
      );
    }
    result.sort((a, b) => {
      const aVal = a[sortKey as keyof Reading] as unknown as number | string;
      const bVal = b[sortKey as keyof Reading] as unknown as number | string;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [readings, search, sortKey, sortDir, statusFilter]);

  const stats = useMemo(() => {
    if (readings.length === 0) return null;
    const scores = readings.map((r) => r.quality_score);
    const anomalies = readings.filter((r) => r.is_anomaly).length;
    return {
      avg: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
      min: Math.min(...scores).toFixed(1),
      max: Math.max(...scores).toFixed(1),
      stdDev: Math.sqrt(scores.reduce((a, b) => a + (b - scores.reduce((x, y) => x + y, 0) / scores.length) ** 2, 0) / scores.length).toFixed(1),
      anomalies,
    };
  }, [readings]);

  const chartData = useMemo(() => {
    return readings.slice(0, 100).reverse().map((r) => ({
      time: new Date(r.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      ph: r.ph,
      turbidity: r.turbidity,
      temperature: r.temperature,
      tds: r.tds,
      dissolved_oxygen: r.dissolved_oxygen,
      conductivity: r.conductivity,
      score: r.quality_score,
    }));
  }, [readings]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading || historyLoading) return <LoadingState message="Loading historical data..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          {error}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-white">Historical Analytics</h1>
        <p className="text-sm text-slate-400">
          {selectedStation?.name} · {readings.length} total readings
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Average Score", value: stats.avg, color: "text-cyan-300" },
            { label: "Minimum", value: stats.min, color: "text-red-300" },
            { label: "Maximum", value: stats.max, color: "text-emerald-300" },
            { label: "Std Deviation", value: stats.stdDev, color: "text-amber-300" },
            { label: "Anomalies", value: String(stats.anomalies), color: "text-orange-300" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Trend Chart */}
      <Card className="p-6">
        <h3 className="mb-4 text-sm font-semibold text-white">Parameter Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            {PARAMS.map((p) => (
              <Line
                key={p.key}
                type="monotone"
                dataKey={p.key}
                stroke={p.color}
                strokeWidth={1.5}
                dot={false}
                name={p.label}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Table */}
      <Card className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-white">Readings Table</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search values..."
                className="rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-500/50 placeholder:text-slate-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-500/50"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="safe" className="bg-slate-800">Safe</option>
              <option value="warning" className="bg-slate-800">Warning</option>
              <option value="critical" className="bg-slate-800">Critical</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                {[
                  { key: "timestamp", label: "Timestamp" },
                  { key: "ph", label: "pH" },
                  { key: "turbidity", label: "Turbidity" },
                  { key: "tds", label: "TDS" },
                  { key: "temperature", label: "Temp" },
                  { key: "dissolved_oxygen", label: "DO" },
                  { key: "conductivity", label: "Cond" },
                  { key: "quality_score", label: "Score" },
                  { key: "status", label: "Status" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer px-3 py-2 text-left font-medium hover:text-white"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-3 py-2 text-xs text-slate-400">{formatTimestamp(r.timestamp)}</td>
                  <td className="px-3 py-2 text-white">{r.ph.toFixed(2)}</td>
                  <td className="px-3 py-2 text-white">{r.turbidity.toFixed(1)}</td>
                  <td className="px-3 py-2 text-white">{r.tds.toFixed(0)}</td>
                  <td className="px-3 py-2 text-white">{r.temperature.toFixed(1)}</td>
                  <td className="px-3 py-2 text-white">{r.dissolved_oxygen.toFixed(1)}</td>
                  <td className="px-3 py-2 text-white">{r.conductivity.toFixed(0)}</td>
                  <td className="px-3 py-2 font-semibold text-white">{r.quality_score.toFixed(1)}</td>
                  <td className="px-3 py-2">
                    <Badge className={STATUS_COLORS[r.status].badge}>
                      {r.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page + 1} of {totalPages} · {filtered.length} readings
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
