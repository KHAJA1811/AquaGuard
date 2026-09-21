import { useState } from "react";
import {
  Settings as SettingsIcon,
  Radio,
  Bell,
  Clock,
  Palette,
  Cpu,
  Database,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Card, Button, Badge } from "@/components/ui";

export default function Settings() {
  const { selectedStation, stations, setSelectedStationId, demoMode, setDemoScenario, demoScenario, systemHealth } = useApp();
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState({
    phMin: "6.5",
    phMax: "8.5",
    turbidityMax: "5",
    tdsMax: "500",
    doMin: "5",
    tempMax: "30",
  });
  const [predictionHorizon, setPredictionHorizon] = useState("24h");
  const [notifications, setNotifications] = useState({
    critical: true,
    warning: true,
    information: false,
    email: false,
  });
  const [theme, setTheme] = useState("dark");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Configure AquaGuard monitoring and alerts</p>
      </div>

      {/* Station Configuration */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Radio size={16} className="text-cyan-400" />
          Station Configuration
        </h3>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Active Station</label>
            <select
              value={selectedStation?.id || ""}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-800">
                  {s.name} — {s.location}
                </option>
              ))}
            </select>
          </div>
          {selectedStation && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  {selectedStation.status.toUpperCase()}
                </Badge>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Sensor Health</p>
                <p className="text-sm font-semibold text-emerald-300">{selectedStation.sensor_health}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Last Sync</p>
                <p className="text-sm font-semibold text-white">{systemHealth.lastSync}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-slate-500">Database</p>
                <p className="text-sm font-semibold text-emerald-300">{systemHealth.database}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Alert Thresholds */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Bell size={16} className="text-amber-400" />
          Alert Thresholds
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">pH Min</label>
            <input
              type="number"
              value={thresholds.phMin}
              onChange={(e) => setThresholds({ ...thresholds, phMin: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">pH Max</label>
            <input
              type="number"
              value={thresholds.phMax}
              onChange={(e) => setThresholds({ ...thresholds, phMax: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Turbidity Max (NTU)</label>
            <input
              type="number"
              value={thresholds.turbidityMax}
              onChange={(e) => setThresholds({ ...thresholds, turbidityMax: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">TDS Max (ppm)</label>
            <input
              type="number"
              value={thresholds.tdsMax}
              onChange={(e) => setThresholds({ ...thresholds, tdsMax: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">DO Min (mg/L)</label>
            <input
              type="number"
              value={thresholds.doMin}
              onChange={(e) => setThresholds({ ...thresholds, doMin: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Temp Max (°C)</label>
            <input
              type="number"
              value={thresholds.tempMax}
              onChange={(e) => setThresholds({ ...thresholds, tempMax: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </Card>

      {/* Prediction & Demo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock size={16} className="text-cyan-400" />
            Prediction Horizon
          </h3>
          <div className="flex gap-2">
            {["6h", "24h", "7d"].map((h) => (
              <button
                key={h}
                onClick={() => setPredictionHorizon(h)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  predictionHorizon === h
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {h === "6h" ? "6 Hours" : h === "24h" ? "24 Hours" : "7 Days"}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Radio size={16} className="text-cyan-400" />
            Demo Mode
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={demoScenario === "healthy" ? "primary" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "healthy" ? "off" : "healthy")}
            >
              Healthy
            </Button>
            <Button
              size="sm"
              variant={demoScenario === "warning" ? "primary" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "warning" ? "off" : "warning")}
            >
              Warning
            </Button>
            <Button
              size="sm"
              variant={demoScenario === "contamination" ? "danger" : "secondary"}
              onClick={() => setDemoScenario(demoScenario === "contamination" ? "off" : "contamination")}
            >
              Contamination
            </Button>
            {demoMode && (
              <Button size="sm" variant="ghost" onClick={() => setDemoScenario("off")}>
                Stop Demo
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
          <Bell size={16} className="text-amber-400" />
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { key: "critical", label: "Critical Alerts", desc: "Immediate notification for critical water quality issues" },
            { key: "warning", label: "Warning Alerts", desc: "Notifications for parameter deviations" },
            { key: "information", label: "Information", desc: "System updates and routine checks" },
            { key: "email", label: "Email Notifications", desc: "Send alerts to registered email" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifications({
                  ...notifications,
                  [item.key]: !notifications[item.key as keyof typeof notifications],
                })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  notifications[item.key as keyof typeof notifications]
                    ? "bg-cyan-500"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Theme & ML Config */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Palette size={16} className="text-violet-400" />
            Theme
          </h3>
          <div className="flex gap-2">
            {["dark", "aqua", "ocean"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${
                  theme === t
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                    : "border border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu size={16} className="text-cyan-400" />
            API / ML Configuration
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-white">ML API URL</p>
                <p className="text-xs text-slate-500">External ML service endpoint</p>
              </div>
              <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30">
                NOT CONFIGURED
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-white">Prediction Engine</p>
                <p className="text-xs text-slate-500">Currently using Demo Forecast Engine</p>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                DEMO MODE
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} size="lg">
          {saved ? (
            <>
              <CheckCircle2 size={18} />
              Saved!
            </>
          ) : (
            <>
              <Save size={18} />
              Save Settings
            </>
          )}
        </Button>
        <p className="text-xs text-slate-500">
          Logged in as {user?.name} ({user?.role})
        </p>
      </div>
    </div>
  );
}
