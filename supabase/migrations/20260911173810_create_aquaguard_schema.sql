/*
# AquaGuard - Water Quality Monitoring Schema

Creates the complete database schema for the AquaGuard AI-based smart water quality monitoring platform.

## Tables Created
1. `stations` - Monitoring stations (Campus Main Tank, Reservoir, Treatment Plant)
2. `readings` - Water quality readings with pH, turbidity, temperature, TDS, DO, conductivity
3. `anomalies` - Detected anomalies with severity, scores, explanations
4. `alerts` - System alerts with severity, type, read/dismissed state
5. `predictions` - AI predictions for water quality parameters
6. `reports` - Generated water quality assessment reports

## Security
- RLS enabled on all tables
- Uses `TO anon, authenticated` since this is a demo/educational platform
- All data is intentionally shared across demo users for presentation purposes
*/

-- ============================================================
-- STATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'online',
  sensor_health text NOT NULL DEFAULT 'good',
  last_sync timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_stations" ON stations;
CREATE POLICY "anon_select_stations" ON stations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_stations" ON stations;
CREATE POLICY "anon_insert_stations" ON stations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_stations" ON stations;
CREATE POLICY "anon_update_stations" ON stations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_stations" ON stations;
CREATE POLICY "anon_delete_stations" ON stations FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- READINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  ph double precision NOT NULL,
  turbidity double precision NOT NULL,
  temperature double precision NOT NULL,
  tds double precision NOT NULL,
  dissolved_oxygen double precision NOT NULL,
  conductivity double precision NOT NULL,
  quality_score double precision NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'safe',
  is_anomaly boolean DEFAULT false
);

ALTER TABLE readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_readings" ON readings;
CREATE POLICY "anon_select_readings" ON readings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_readings" ON readings;
CREATE POLICY "anon_insert_readings" ON readings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_readings" ON readings;
CREATE POLICY "anon_update_readings" ON readings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_readings" ON readings;
CREATE POLICY "anon_delete_readings" ON readings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_readings_station_id ON readings(station_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_readings_status ON readings(status);

-- ============================================================
-- ANOMALIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  reading_id uuid REFERENCES readings(id) ON DELETE SET NULL,
  parameter text NOT NULL,
  observed_value double precision NOT NULL,
  expected_value double precision NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  score double precision NOT NULL DEFAULT 0,
  explanation text,
  possible_cause text,
  recommendation text,
  detected_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false
);

ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_anomalies" ON anomalies;
CREATE POLICY "anon_select_anomalies" ON anomalies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_anomalies" ON anomalies;
CREATE POLICY "anon_insert_anomalies" ON anomalies FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_anomalies" ON anomalies;
CREATE POLICY "anon_update_anomalies" ON anomalies FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_anomalies" ON anomalies;
CREATE POLICY "anon_delete_anomalies" ON anomalies FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_anomalies_station_id ON anomalies(station_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_detected_at ON anomalies(detected_at DESC);

-- ============================================================
-- ALERTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'warning',
  severity text NOT NULL DEFAULT 'warning',
  title text NOT NULL,
  message text NOT NULL,
  parameter text,
  value double precision,
  threshold double precision,
  recommended_action text,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_alerts" ON alerts;
CREATE POLICY "anon_select_alerts" ON alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_alerts" ON alerts;
CREATE POLICY "anon_insert_alerts" ON alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_alerts" ON alerts;
CREATE POLICY "anon_update_alerts" ON alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_alerts" ON alerts;
CREATE POLICY "anon_delete_alerts" ON alerts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_alerts_station_id ON alerts(station_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- ============================================================
-- PREDICTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  timestamp timestamptz NOT NULL DEFAULT now(),
  parameter text NOT NULL,
  current_value double precision NOT NULL,
  predicted_value double precision NOT NULL,
  prediction_horizon text NOT NULL DEFAULT '24h',
  confidence double precision NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  trend text NOT NULL DEFAULT 'stable'
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_predictions" ON predictions;
CREATE POLICY "anon_select_predictions" ON predictions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_predictions" ON predictions;
CREATE POLICY "anon_insert_predictions" ON predictions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_predictions" ON predictions;
CREATE POLICY "anon_update_predictions" ON predictions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_predictions" ON predictions;
CREATE POLICY "anon_delete_predictions" ON predictions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_predictions_station_id ON predictions(station_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  generated_at timestamptz DEFAULT now(),
  summary text,
  overall_score double precision DEFAULT 0,
  overall_status text DEFAULT 'safe',
  report_data jsonb
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reports" ON reports;
CREATE POLICY "anon_select_reports" ON reports FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reports" ON reports;
CREATE POLICY "anon_insert_reports" ON reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reports" ON reports;
CREATE POLICY "anon_update_reports" ON reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reports" ON reports;
CREATE POLICY "anon_delete_reports" ON reports FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reports_station_id ON reports(station_id);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON reports(generated_at DESC);