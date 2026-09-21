import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  FlaskConical,
  TrendingUp,
  AlertTriangle,
  Bell,
  History,
  FileText,
  Settings,
  Droplets,
  Menu,
  X,
  LogOut,
  Radio,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { StatusDot } from "@/components/ui";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "operator", "viewer"] },
  { path: "/monitoring", label: "Live Monitoring", icon: Activity, roles: ["admin", "operator", "viewer"] },
  { path: "/analysis", label: "Analysis", icon: FlaskConical, roles: ["admin", "operator"] },
  { path: "/prediction", label: "AI Prediction", icon: TrendingUp, roles: ["admin", "operator", "viewer"] },
  { path: "/anomalies", label: "Anomalies", icon: AlertTriangle, roles: ["admin", "operator", "viewer"] },
  { path: "/alerts", label: "Alerts", icon: Bell, roles: ["admin", "operator", "viewer"] },
  { path: "/history", label: "Historical", icon: History, roles: ["admin", "operator", "viewer"] },
  { path: "/reports", label: "Reports", icon: FileText, roles: ["admin", "operator"] },
  { path: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadAlertCount, demoMode, demoScenario, selectedStation, stations, setSelectedStationId } = useApp();

  const visibleItems = NAV_ITEMS.filter((item) =>
    user && item.roles.includes(user.role)
  );

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-white/10 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">AquaGuard</span>
                <p className="text-[10px] text-slate-400">Water Intelligence</p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 border border-cyan-500/20"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                    {item.label === "Alerts" && unreadAlertCount > 0 && (
                      <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadAlertCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Demo Mode Indicator */}
          {demoMode && (
            <div className="mx-3 mb-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3">
              <div className="flex items-center gap-2">
                <Radio size={14} className="animate-pulse text-cyan-400" />
                <span className="text-xs font-semibold text-cyan-300">Demo Mode Active</span>
              </div>
              <p className="mt-1 text-[10px] text-cyan-400/70 capitalize">
                Scenario: {demoScenario}
              </p>
            </div>
          )}

          {/* User */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-xs font-bold text-white">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-[10px] capitalize text-slate-400">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-400 hover:text-white lg:hidden"
              >
                <Menu size={22} />
              </button>
              {/* Station selector */}
              <div className="flex items-center gap-2">
                <StatusDot status={selectedStation?.status || "online"} />
                <select
                  value={selectedStation?.id || ""}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-cyan-500/50"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-800">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/alerts"
                className="relative text-slate-400 hover:text-white transition-colors"
              >
                <Bell size={20} />
                {unreadAlertCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadAlertCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
