import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Button, LoadingState, Modal, EmptyState } from "@/components/ui";
import { getAnomalies, resolveAnomaly } from "@/services/api";
import { SEVERITY_COLORS, formatTimestamp, timeAgo } from "@/utils/format";
import type { Anomaly } from "@/types";

export default function Anomalies() {
  const { selectedStation } = useApp();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [resolving, setResolving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnomalies(selectedStation?.id);
      setAnomalies(data);
    } catch {
      setError("Unable to load anomaly data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStation?.id]);

  const handleResolve = async (id: string) => {
    setResolving(true);
    try {
      await resolveAnomaly(id);
      setAnomalies(anomalies.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
      if (selected?.id === id) setSelected({ ...selected, resolved: true });
    } catch {
      // silent
    } finally {
      setResolving(false);
    }
  };

  const stats = {
    total: anomalies.length,
    high: anomalies.filter((a) => a.severity === "high" || a.severity === "critical").length,
    critical: anomalies.filter((a) => a.severity === "critical").length,
    resolved: anomalies.filter((a) => a.resolved).length,
  };

  if (loading) return <LoadingState message="Loading anomalies..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={load}>Retry</Button>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Anomaly Detection Overview</h1>
        <p className="text-sm text-slate-400">
          {selectedStation?.name} · Statistical detection using z-score analysis
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Anomalies", value: stats.total, color: "text-cyan-300", bg: "bg-cyan-500/10" },
          { label: "High Severity", value: stats.high, color: "text-orange-300", bg: "bg-orange-500/10" },
          { label: "Critical", value: stats.critical, color: "text-red-300", bg: "bg-red-500/10" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-300", bg: "bg-emerald-500/10" },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className={`mb-2 inline-flex rounded-lg ${stat.bg} px-2.5 py-1`}>
              <span className={`text-xs font-semibold ${stat.color}`}>{stat.label}</span>
            </div>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <AlertTriangle size={16} className="text-amber-400" />
            Anomaly Timeline
          </h3>
          <Button size="sm" variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>

        {anomalies.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={32} />}
            title="No anomalies detected"
            message="All readings are within normal patterns"
          />
        ) : (
          <div className="space-y-2">
            {anomalies.map((anomaly) => {
              const sevColor = SEVERITY_COLORS[anomaly.severity] || SEVERITY_COLORS.low;
              return (
                <div
                  key={anomaly.id}
                  onClick={() => setSelected(anomaly)}
                  className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${sevColor.dot}`} />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">{anomaly.parameter}</p>
                      <Badge className={sevColor.badge}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                      {anomaly.resolved && (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          RESOLVED
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Observed: {anomaly.observed_value} · Expected: {anomaly.expected_value} · {timeAgo(anomaly.detected_at)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-600" />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Anomaly Details"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={(SEVERITY_COLORS[selected.severity] || SEVERITY_COLORS.low).badge}>
                {selected.severity.toUpperCase()}
              </Badge>
              {selected.resolved ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  RESOLVED
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                  OPEN
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Parameter</p>
                <p className="text-sm font-semibold text-white">{selected.parameter}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Anomaly Score</p>
                <p className="text-sm font-semibold text-white">{selected.score}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Observed Value</p>
                <p className="text-sm font-semibold text-amber-300">{selected.observed_value}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Expected Value</p>
                <p className="text-sm font-semibold text-emerald-300">{selected.expected_value}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-500">Explanation</p>
              <p className="text-sm text-slate-300">{selected.explanation}</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-500">Possible Cause</p>
              <p className="text-sm text-slate-300">{selected.possible_cause}</p>
            </div>

            <div>
              <p className="mb-1 text-xs text-slate-500">Recommendation</p>
              <p className="text-sm text-slate-300">{selected.recommendation}</p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              Detected: {formatTimestamp(selected.detected_at)}
            </div>

            {!selected.resolved && (
              <Button
                onClick={() => handleResolve(selected.id)}
                disabled={resolving}
                className="w-full"
                variant="secondary"
              >
                {resolving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Resolving...
                  </>
                ) : (
                  "Mark as Resolved"
                )}
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
