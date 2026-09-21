import { Link } from "react-router-dom";
import {
  Droplets,
  Activity,
  TrendingUp,
  AlertTriangle,
  Bell,
  History,
  FileText,
  ArrowRight,
  Radio,
  Database,
  Cpu,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    desc: "Continuous tracking of pH, turbidity, temperature, TDS, dissolved oxygen, and conductivity from multiple monitoring stations.",
  },
  {
    icon: TrendingUp,
    title: "AI Prediction",
    desc: "Trend-based forecasting engine that predicts future water quality values with confidence scoring and risk assessment.",
  },
  {
    icon: AlertTriangle,
    title: "Anomaly Detection",
    desc: "Statistical anomaly detection using z-score analysis to identify readings that deviate significantly from historical patterns.",
  },
  {
    icon: Bell,
    title: "Intelligent Alerts",
    desc: "Automated alert generation with severity classification, threshold monitoring, and recommended actions.",
  },
  {
    icon: History,
    title: "Historical Analytics",
    desc: "Comprehensive historical data analysis with trend charts, statistics, and searchable data tables.",
  },
  {
    icon: FileText,
    title: "Automated Reports",
    desc: "Professional PDF report generation with executive summaries, parameter analysis, and methodology documentation.",
  },
];

const FLOW_STEPS = [
  { label: "Collect", icon: Radio, desc: "Sensor readings from monitoring stations" },
  { label: "Validate", icon: ShieldCheck, desc: "Input validation and range checking" },
  { label: "Analyze", icon: Cpu, desc: "Water quality scoring and classification" },
  { label: "Predict", icon: TrendingUp, desc: "AI forecasting and risk assessment" },
  { label: "Alert", icon: Bell, desc: "Automated alerts and recommendations" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute right-1/4 top-40 h-[400px] w-[400px] rounded-full bg-teal-500/15 blur-[100px]" />
          <div className="absolute left-1/2 top-60 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[80px]" />
        </div>

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-12">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30">
              <Droplets className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">AquaGuard</span>
          </div>
          <Link
            to="/login"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium backdrop-blur-xl transition-all hover:bg-white/10"
          >
            Sign In
          </Link>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-20 text-center lg:py-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300 backdrop-blur-xl">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            AI-Based Water Quality Intelligence Platform
          </div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight lg:text-7xl">
            <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Smarter Water.
            </span>
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-teal-300 bg-clip-text text-transparent">
              Safer Future.
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300 lg:text-xl">
            AI-powered water quality monitoring, prediction, and anomaly detection.
            Track six critical parameters in real-time, forecast future conditions,
            and catch contamination events before they escalate.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-8 py-3.5 text-base font-semibold shadow-xl shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-teal-400 hover:shadow-cyan-500/40"
            >
              Explore Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold backdrop-blur-xl transition-all hover:bg-white/10"
            >
              Start Monitoring
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold lg:text-4xl">Why AquaGuard?</h2>
            <p className="text-slate-400">
              A complete water quality intelligence platform with monitoring, analysis, prediction, and reporting.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:bg-white/10"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300 transition-transform group-hover:scale-110">
                    <Icon size={24} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold lg:text-4xl">How It Works</h2>
            <p className="text-slate-400">From sensor reading to intelligent alert in five steps.</p>
          </div>

          <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-1 items-center gap-4">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-xl">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 text-cyan-300">
                      <Icon size={20} />
                    </div>
                    <p className="text-sm font-semibold">{step.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{step.desc}</p>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <ArrowRight size={20} className="hidden shrink-0 text-cyan-500/50 lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="relative px-6 py-12 lg:px-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 p-8 text-center backdrop-blur-xl lg:p-12">
          <Database className="mx-auto mb-4 text-cyan-400" size={32} />
          <h2 className="mb-2 text-2xl font-bold">Built for Real-World Use</h2>
          <p className="mx-auto mb-6 max-w-2xl text-slate-400">
            AquaGuard is architected to connect with real IoT sensors (ESP32/Arduino) and external ML models.
            The demo mode exercises the same backend APIs that production devices would use.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 font-semibold shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-teal-400"
          >
            Launch Dashboard
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-500">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">AquaGuard</span>
          </div>
          <p className="text-xs text-slate-500">
            AI-Based Smart Water Quality Monitoring, Prediction & Anomaly Detection
          </p>
        </div>
      </footer>
    </div>
  );
}
