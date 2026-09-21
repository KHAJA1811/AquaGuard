import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Clock,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Button, LoadingState, Modal, EmptyState } from "@/components/ui";
import { getAlerts, markAlertRead, dismissAlert } from "@/services/api";
import { SEVERITY_COLORS, formatTimestamp, timeAgo } from "@/utils/format";
import type { Alert as AlertType } from "@/types";

const SEVERITY_ICONS: Record<string, typeof Bell> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  information: Info,
  info: Info,
};

export default function Alerts() {
  const { selectedStation, refreshAlerts } = useApp();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AlertType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts(selectedStation?.id);
      setAlerts(data);
    } catch {
      setError("Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [selectedStation?.id]);

  const handleMarkRead = async (id: string) => {
    setActionLoading(true);
    try {
      await markAlertRead(id);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
      if (selected?.id === id) setSelected({ ...selected, is_read: true });
      await refreshAlerts();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    setActionLoading(true);
    try {
      await dismissAlert(id);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_dismissed: true, is_read: true } : a)));
      await refreshAlerts();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return !a.is_dismissed;
    if (filter === "unread") return !a.is_read && !a.is_dismissed;
    if (filter === "critical") return a.severity === "critical" && !a.is_dismissed;
    if (filter === "warning") return a.severity === "warning" && !a.is_dismissed;
    if (filter === "info") return a.severity === "information" && !a.is_dismissed;
    return true;
  });

  if (loading) return <LoadingState message="Loading alerts..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={load}>Retry</Button>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-sm text-slate-400">
            {selectedStation?.name} · {alerts.filter((a) => !a.is_read && !a.is_dismissed).length} unread
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Unread", value: "unread" },
          { label: "Critical", value: "critical" },
          { label: "Warning", value: "warning" },
          { label: "Information", value: "info" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filter === tab.value
                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        {filteredAlerts.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} />}
            title="No alerts"
            message="All clear — no active alerts for this filter"
          />
        ) : (
          <div className="space-y-3">
            {filteredAlerts.map((alert) => {
              const sevColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.information;
              const Icon = SEVERITY_ICONS[alert.severity] || Bell;
              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 transition-all ${
                    alert.is_read
                      ? "border-white/5 bg-white/[0.02]"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        alert.severity === "critical" ? "bg-red-500/20" :
                        alert.severity === "warning" ? "bg-amber-500/20" :
                        "bg-sky-500/20"
                      }`}
                    >
                      <Icon size={16} className={
                        alert.severity === "critical" ? "text-red-400" :
                        alert.severity === "warning" ? "text-amber-400" :
                        "text-sky-400"
                      } />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{alert.title}</p>
                        <Badge className={sevColor.badge}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        {!alert.is_read && (
                          <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                      {alert.recommended_action && (
                        <p className="mt-1 text-xs text-cyan-400/70">
                          Action: {alert.recommended_action}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={11} />
                          {timeAgo(alert.created_at)}
                        </span>
                        {alert.stations?.name && (
                          <span className="text-xs text-slate-500">
                            · {alert.stations.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      {!alert.is_read && (
                        <button
                          onClick={() => handleMarkRead(alert.id)}
                          disabled={actionLoading}
                          className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-all hover:text-emerald-400 disabled:opacity-50"
                          title="Mark as read"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        disabled={actionLoading}
                        className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-400 transition-all hover:text-red-400 disabled:opacity-50"
                        title="Dismiss"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
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
        title="Alert Details"
      >
        {selected && (
          <div className="space-y-4">
            <Badge className={(SEVERITY_COLORS[selected.severity] || SEVERITY_COLORS.information).badge}>
              {selected.severity.toUpperCase()}
            </Badge>
            <div>
              <p className="text-sm font-semibold text-white">{selected.title}</p>
              <p className="mt-1 text-sm text-slate-300">{selected.message}</p>
            </div>
            {selected.parameter && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Parameter</p>
                  <p className="text-sm font-semibold text-white">{selected.parameter}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Value</p>
                  <p className="text-sm font-semibold text-amber-300">{selected.value}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Threshold</p>
                  <p className="text-sm font-semibold text-red-300">{selected.threshold}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-slate-500">Time</p>
                  <p className="text-sm font-semibold text-white">{formatTimestamp(selected.created_at)}</p>
                </div>
              </div>
            )}
            {selected.recommended_action && (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
                <p className="text-xs text-cyan-400">Recommended Action</p>
                <p className="mt-1 text-sm text-slate-300">{selected.recommended_action}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
