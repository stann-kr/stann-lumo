-- Mix/track media that is the same in every language: tracklist text, recording date and cover image.
-- Additive only. `tracks` keys rows by (id, lang), so this table keys by the shared track id without a foreign key;
-- the tracks writer removes rows whose id no longer exists in any language.
-- cover_image_id names an R2 object at gallery/<id> served by /api/media/<id>. It has no gallery_photos row,
-- so covers never appear in the public archive.
CREATE TABLE IF NOT EXISTS track_media (
  track_id       TEXT PRIMARY KEY,
  tracklist      TEXT NOT NULL DEFAULT '',
  recorded_on    TEXT NOT NULL DEFAULT '',
  cover_image_id TEXT,
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
