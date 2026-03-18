-- About 페이지 동적 섹션
CREATE TABLE IF NOT EXISTS about_sections (
  id           TEXT NOT NULL,
  lang         TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  title        TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('paragraphs', 'philosophy-items')),
  section_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- About 섹션 단락 테이블
CREATE TABLE IF NOT EXISTS about_section_paragraphs (
  id           TEXT NOT NULL PRIMARY KEY,
  section_id   TEXT NOT NULL,
  lang         TEXT NOT NULL,
  content      TEXT NOT NULL,
  item_order   INTEGER NOT NULL DEFAULT 0
);

-- About 섹션 철학 항목 테이블
CREATE TABLE IF NOT EXISTS about_section_philosophy_items (
  id           TEXT NOT NULL PRIMARY KEY,
  section_id   TEXT NOT NULL,
  lang         TEXT NOT NULL,
  quote        TEXT NOT NULL,
  description  TEXT,
  item_order   INTEGER NOT NULL DEFAULT 0
);

-- 페이지 메타 키-값 테이블
-- page: 'home' | 'music' | 'events' | 'contact' | 'link'
-- key: 'title' | 'subtitle' | 'navTitle' | 'upcomingTitle' | 'pastTitle' | ...
CREATE TABLE IF NOT EXISTS page_meta (
  page  TEXT NOT NULL,
  lang  TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  key   TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (page, lang, key)
);
