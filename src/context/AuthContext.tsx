import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { UserRole } from "@/types";

interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "aquaguard_auth";

const DEMO_USERS: Record<string, { password: string; user: AuthUser }> = {
  "admin@aquaguard.io": {
    password: "admin123",
    user: { email: "admin@aquaguard.io", name: "System Administrator", role: "admin" },
  },
  "operator@aquaguard.io": {
    password: "operator123",
    user: { email: "operator@aquaguard.io", name: "Plant Operator", role: "operator" },
  },
  "viewer@aquaguard.io": {
    password: "viewer123",
    user: { email: "viewer@aquaguard.io", name: "Field Viewer", role: "viewer" },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const demoUser = DEMO_USERS[email.toLowerCase()];
    if (!demoUser || demoUser.password !== password) {
      throw new Error("Invalid credentials. Please check your email and password.");
    }
    setUser(demoUser.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demoUser.user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
