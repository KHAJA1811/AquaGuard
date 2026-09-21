-- Reseed the three demonstration stations with the exact IDs
-- that the existing 1008 readings already reference.
-- This fixes the orphaned readings issue without modifying any reading data.

INSERT INTO stations (id, name, location, status, sensor_health, last_sync, created_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Campus Main Tank', 'Engineering Block A, Campus', 'online', 'good', now(), now()),
  ('a0000000-0000-0000-0000-000000000002', 'Reservoir', 'North Campus Reservoir', 'online', 'good', now(), now()),
  ('a0000000-0000-0000-0000-000000000003', 'Treatment Plant', 'Water Treatment Facility, East Wing', 'online', 'good', now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  status = EXCLUDED.status,
  sensor_health = EXCLUDED.sensor_health,
  last_sync = now();
