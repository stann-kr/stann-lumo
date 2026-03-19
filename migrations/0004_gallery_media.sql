-- =============================================================
-- Phase 4-g: 갤러리 미디어 확장 + 레이아웃 설정 + 레거시 정리
-- =============================================================

-- ─────────────────────────────────────────
-- A-1: 레거시 테이블 삭제
-- ─────────────────────────────────────────
DROP TABLE IF EXISTS biography_paragraphs;
DROP TABLE IF EXISTS musical_philosophy;
DROP TABLE IF EXISTS design_philosophy_paragraphs;
DROP TABLE IF EXISTS media_files;

-- ─────────────────────────────────────────
-- A-2: gallery_photos 미디어 확장
-- ─────────────────────────────────────────
ALTER TABLE gallery_photos ADD COLUMN media_type          TEXT NOT NULL DEFAULT 'image';
ALTER TABLE gallery_photos ADD COLUMN focal_x             REAL NOT NULL DEFAULT 50;
ALTER TABLE gallery_photos ADD COLUMN focal_y             REAL NOT NULL DEFAULT 50;
ALTER TABLE gallery_photos ADD COLUMN video_youtube_id    TEXT;
ALTER TABLE gallery_photos ADD COLUMN video_thumbnail_url TEXT;

-- ─────────────────────────────────────────
-- A-3: gallery_settings 레이아웃 설정 (단일 행)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gallery_settings (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  layout_mode      TEXT    NOT NULL DEFAULT 'masonry',   -- 'masonry' | 'grid'
  columns_mobile   INTEGER NOT NULL DEFAULT 2,           -- 1 | 2
  columns_tablet   INTEGER NOT NULL DEFAULT 3,           -- 2 | 3
  columns_desktop  INTEGER NOT NULL DEFAULT 4,           -- 2 | 3 | 4 | 5
  gap_size         TEXT    NOT NULL DEFAULT 'md',        -- 'sm' | 'md' | 'lg'
  aspect_ratio     TEXT    NOT NULL DEFAULT 'auto',      -- 'auto' | '1:1' | '4:3' | '3:4' | '16:9'
  hover_effect     TEXT    NOT NULL DEFAULT 'zoom',      -- 'zoom' | 'fade' | 'none'
  caption_display  TEXT    NOT NULL DEFAULT 'overlay',   -- 'overlay' | 'below' | 'hidden'
  lightbox_enabled INTEGER NOT NULL DEFAULT 1            -- 0 | 1
);

INSERT OR IGNORE INTO gallery_settings (id) VALUES (1);
