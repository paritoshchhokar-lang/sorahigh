CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  trip TEXT NOT NULL,
  timing TEXT NOT NULL,
  group_size TEXT NOT NULL,
  page TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enquiry_rate_limits (
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
