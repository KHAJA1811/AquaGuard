import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "admin" | "operator" | "viewer") => {
    const creds = {
      admin: { email: "admin@aquaguard.io", password: "admin123" },
      operator: { email: "operator@aquaguard.io", password: "operator123" },
      viewer: { email: "viewer@aquaguard.io", password: "viewer123" },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <Link to="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 shadow-lg shadow-cyan-500/30">
                <Droplets className="h-7 w-7 text-white" />
              </div>
            </Link>
            <h1 className="text-2xl font-bold">Welcome to AquaGuard</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in to access the monitoring dashboard</p>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@aquaguard.io"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 py-3 font-semibold shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 border-t border-white/10 pt-4">
              <p className="mb-3 text-center text-xs text-slate-500">Demo Credentials (click to fill)</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => fillDemo("admin")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-medium text-slate-300 transition-all hover:border-cyan-500/30 hover:text-cyan-300"
                >
                  Admin
                </button>
                <button
                  onClick={() => fillDemo("operator")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-medium text-slate-300 transition-all hover:border-cyan-500/30 hover:text-cyan-300"
                >
                  Operator
                </button>
                <button
                  onClick={() => fillDemo("viewer")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-medium text-slate-300 transition-all hover:border-cyan-500/30 hover:text-cyan-300"
                >
                  Viewer
                </button>
              </div>
            </div>
          </div>

          <Link
            to="/"
            className="mt-4 block text-center text-xs text-slate-500 hover:text-slate-300"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
