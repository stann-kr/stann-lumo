-- =============================================================
-- Gallery 사진 테이블
-- Phase 4-f: R2 미디어 + 갤러리 기능
-- =============================================================

CREATE TABLE IF NOT EXISTS gallery_photos (
  id         TEXT    NOT NULL PRIMARY KEY,       -- UUID (= R2 key)
  filename   TEXT    NOT NULL,
  mime_type  TEXT    NOT NULL DEFAULT 'image/jpeg',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  alt_text   TEXT    NOT NULL DEFAULT '',
  caption    TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
