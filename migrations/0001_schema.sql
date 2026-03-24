-- =============================================================
-- stann-lumo D1 통합 스키마 (최종 상태)
-- 0001~0010 마이그레이션 파일을 단일 클린 파일로 통합
-- display_settings, gallery_settings 테이블 제거 (레이아웃 고정 전환)
-- =============================================================

-- -------------------------------------------------------------
-- 설정 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS site_config (
  id                       INTEGER PRIMARY KEY DEFAULT 1,
  site_name                TEXT    NOT NULL DEFAULT 'STANN LUMO',
  tagline                  TEXT    NOT NULL DEFAULT 'TECHNO / SEOUL',
  version                  TEXT    NOT NULL DEFAULT 'v1.0.0',
  terminal_url             TEXT,
  terminal_description     TEXT,
  terminal_font_size       TEXT    DEFAULT 'md',
  terminal_animation_speed TEXT    DEFAULT 'normal',
  terminal_prompt_text     TEXT    DEFAULT '>',
  terminal_show_embed      INTEGER DEFAULT 0,
  terminal_embed_height    TEXT    DEFAULT '400px'
);

INSERT OR IGNORE INTO site_config (id) VALUES (1);

CREATE TABLE IF NOT EXISTS theme_colors (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  `primary`  TEXT NOT NULL DEFAULT '#00ff00',
  secondary  TEXT NOT NULL DEFAULT '#ffffff',
  accent     TEXT NOT NULL DEFAULT '#00ff00',
  muted      TEXT NOT NULL DEFAULT '#666666',
  bg         TEXT NOT NULL DEFAULT '#000000',
  bg_sidebar TEXT NOT NULL DEFAULT '#000000'
);

INSERT OR IGNORE INTO theme_colors (id) VALUES (1);

CREATE TABLE IF NOT EXISTS ra_api_config (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT,
  api_key TEXT,
  dj_id   TEXT,
  option  TEXT NOT NULL DEFAULT '1',
  year    TEXT
);

INSERT OR IGNORE INTO ra_api_config (id) VALUES (1);

-- -------------------------------------------------------------
-- 콘텐츠 테이블 (다국어: lang = 'en' | 'ko')
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS artist_info (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  key        TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS home_sections (
  id          TEXT    NOT NULL,
  lang        TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  path        TEXT    NOT NULL,
  icon        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS about_sections (
  id            TEXT    NOT NULL,
  lang          TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  title         TEXT    NOT NULL,
  type          TEXT    NOT NULL CHECK (type IN ('paragraphs', 'philosophy-items')),
  section_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS about_section_paragraphs (
  id         TEXT    NOT NULL PRIMARY KEY,
  section_id TEXT    NOT NULL,
  lang       TEXT    NOT NULL,
  content    TEXT    NOT NULL,
  item_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS about_section_philosophy_items (
  id          TEXT    NOT NULL PRIMARY KEY,
  section_id  TEXT    NOT NULL,
  lang        TEXT    NOT NULL,
  quote       TEXT    NOT NULL,
  description TEXT,
  item_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS page_meta (
  page  TEXT NOT NULL,
  lang  TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  key   TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (page, lang, key)
);

CREATE TABLE IF NOT EXISTS tracks (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  title      TEXT    NOT NULL,
  type       TEXT    NOT NULL,
  duration   TEXT    NOT NULL,
  year       TEXT    NOT NULL,
  platform   TEXT    NOT NULL,
  link       TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- -------------------------------------------------------------
-- 이벤트 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS performances (
  id               TEXT    NOT NULL PRIMARY KEY,
  date             TEXT    NOT NULL,
  venue            TEXT    NOT NULL,
  location         TEXT,
  time             TEXT,
  title            TEXT    NOT NULL,
  lineup           TEXT,
  ra_event_link    TEXT,
  ra_event_id      TEXT,
  poster_image_id  TEXT,
  status           TEXT    NOT NULL DEFAULT 'Announced',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  ra_venue_id      TEXT,
  ra_country_name  TEXT,
  ra_area_name     TEXT,
  ra_area_id       TEXT,
  ra_address       TEXT,
  ra_cost          TEXT,
  ra_promoter      TEXT,
  ra_venue_link    TEXT,
  ra_has_tickets   TEXT,
  ra_has_barcode   TEXT,
  ra_promoter_id   TEXT,
  ra_lineup_raw    TEXT
);

CREATE TABLE IF NOT EXISTS events_info (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  contact_email  TEXT NOT NULL DEFAULT '',
  response_time  TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO events_info (id) VALUES (1);

CREATE TABLE IF NOT EXISTS events_set_durations (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS events_tech_requirements (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- -------------------------------------------------------------
-- 링크 / 연락처 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS link_platforms (
  id          TEXT    NOT NULL,
  lang        TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  platform    TEXT    NOT NULL,
  url         TEXT    NOT NULL,
  icon        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

CREATE TABLE IF NOT EXISTS contact_info (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  label      TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  icon       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- -------------------------------------------------------------
-- 갤러리 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gallery_photos (
  id                  TEXT    NOT NULL PRIMARY KEY,
  filename            TEXT    NOT NULL,
  mime_type           TEXT    NOT NULL DEFAULT 'image/jpeg',
  size_bytes          INTEGER NOT NULL DEFAULT 0,
  alt_text            TEXT    NOT NULL DEFAULT '',
  caption             TEXT    NOT NULL DEFAULT '',
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TEXT    NOT NULL DEFAULT (datetime('now')),
  media_type          TEXT    NOT NULL DEFAULT 'image',
  focal_x             REAL    NOT NULL DEFAULT 50,
  focal_y             REAL    NOT NULL DEFAULT 50,
  video_youtube_id    TEXT,
  video_thumbnail_url TEXT,
  linked_event_id     TEXT
);

CREATE INDEX IF NOT EXISTS idx_gallery_linked_event
  ON gallery_photos (linked_event_id);

-- -------------------------------------------------------------
-- 터미널 커스텀 필드
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS terminal_custom_fields (
  id          TEXT    PRIMARY KEY,
  field_key   TEXT    NOT NULL,
  field_value TEXT    NOT NULL DEFAULT '',
  field_type  TEXT    NOT NULL DEFAULT 'text',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- -------------------------------------------------------------
-- 인증 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
  ON admin_sessions (expires_at);
