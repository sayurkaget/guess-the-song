CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'song', 'other')),
  message TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  game_details TEXT NOT NULL DEFAULT ''
);
