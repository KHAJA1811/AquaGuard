import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Station, Reading } from "@/types";
import {
  getStations,
  getReadings,
  createReading,
  getAlerts,
} from "@/services/api";

export type DemoScenario = "healthy" | "warning" | "contamination" | "off";

interface AppContextValue {
  stations: Station[];
  selectedStation: Station | null;
  setSelectedStationId: (id: string) => void;
  readings: Reading[];
  latestReading: Reading | null;
  unreadAlertCount: number;
  demoMode: boolean;
  demoScenario: DemoScenario;
  setDemoScenario: (s: DemoScenario) => void;
  refreshReadings: () => Promise<void>;
  refreshAlerts: () => Promise<void>;
  loading: boolean;
  error: string | null;
  systemHealth: {
    sensorConnectivity: string;
    dataPipeline: string;
    analysisEngine: string;
    predictionEngine: string;
    database: string;
    lastSync: string;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

const SCENARIO_VALUES: Record<
  Exclude<DemoScenario, "off">,
  { ph: number; turbidity: number; temperature: number; tds: number; dissolvedOxygen: number; conductivity: number }
> = {
  healthy: {
    ph: 7.2,
    turbidity: 2.1,
    temperature: 25.5,
    tds: 310,
    dissolvedOxygen: 7.8,
    conductivity: 450,
  },
  warning: {
    ph: 6.3,
    turbidity: 7.5,
    temperature: 28.5,
    tds: 520,
    dissolvedOxygen: 5.2,
    conductivity: 650,
  },
  contamination: {
    ph: 5.8,
    turbidity: 18.7,
    temperature: 29.0,
    tds: 720,
    dissolvedOxygen: 3.1,
    conductivity: 850,
  },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [readings, setReadings] = useState<Reading[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [demoScenario, setDemoScenarioState] = useState<DemoScenario>("off");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbConnected, setDbConnected] = useState(true);
  const [lastSync, setLastSync] = useState("Just now");
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simValuesRef = useRef(SCENARIO_VALUES.healthy);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || null;
  const latestReading = readings.length > 0 ? readings[0] : null;

  const refreshReadings = useCallback(async () => {
    if (!selectedStationId) return;
    try {
      const data = await getReadings(selectedStationId, 200);
      setReadings(data);
      setError(null);
    } catch (err) {
      console.error("[AquaGuard] refreshReadings error:", err);
      setError("Unable to load monitoring data. Showing demo data.");
    }
  }, [selectedStationId]);

  const refreshAlerts = useCallback(async () => {
    try {
      const alerts = await getAlerts();
      setUnreadAlertCount(alerts.filter((a) => !a.is_read && !a.is_dismissed).length);
    } catch {
      // silent
    }
  }, []);

  // Load stations on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const s = await getStations();
        setStations(s);
        if (s.length > 0 && !selectedStationId) {
          setSelectedStationId(s[0].id);
        }
        setDbConnected(true);
        setError(null);
      } catch (err) {
        console.error("[AquaGuard] Failed to load stations:", err);
        setDbConnected(false);
        setError("Unable to connect to monitoring service. Using demo data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load readings when station changes
  useEffect(() => {
    if (selectedStationId) {
      refreshReadings();
      refreshAlerts();
    }
  }, [selectedStationId, refreshReadings, refreshAlerts]);

  // Update last sync time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSync("Just now");
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Demo mode simulation
  const setDemoScenario = useCallback(
    (scenario: DemoScenario) => {
      setDemoScenarioState(scenario);
      if (scenario === "off") {
        setDemoMode(false);
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
      } else {
        setDemoMode(true);
        simValuesRef.current = { ...SCENARIO_VALUES[scenario] };

        // Send an immediate reading
        const sendReading = async () => {
          if (!selectedStationId) return;
          const v = simValuesRef.current;
          // Add small random noise for realism
          const noise = () => (Math.random() - 0.5) * 0.1;
          try {
            await createReading({
              stationId: selectedStationId,
              ph: Math.round((v.ph + noise() * 0.3) * 100) / 100,
              turbidity: Math.round((v.turbidity + Math.abs(noise()) * v.turbidity * 0.1) * 100) / 100,
              temperature: Math.round((v.temperature + noise() * 0.5) * 100) / 100,
              tds: Math.round((v.tds + noise() * 15) * 100) / 100,
              dissolvedOxygen: Math.round((v.dissolvedOxygen + noise() * 0.3) * 100) / 100,
              conductivity: Math.round((v.conductivity + noise() * 20) * 100) / 100,
            });
            await refreshReadings();
            await refreshAlerts();
            setLastSync("Just now");
          } catch {
            // silent
          }
        };

        sendReading();

        // Set up interval for continuous readings
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        simIntervalRef.current = setInterval(sendReading, 8000);
      }
    },
    [selectedStationId, refreshReadings, refreshAlerts]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const value: AppContextValue = {
    stations,
    selectedStation,
    setSelectedStationId,
    readings,
    latestReading,
    unreadAlertCount,
    demoMode,
    demoScenario,
    setDemoScenario,
    refreshReadings,
    refreshAlerts,
    loading,
    error,
    systemHealth: {
      sensorConnectivity: "ONLINE",
      dataPipeline: "HEALTHY",
      analysisEngine: "READY",
      predictionEngine: "READY",
      database: dbConnected ? "CONNECTED" : "DEMO MODE",
      lastSync,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
