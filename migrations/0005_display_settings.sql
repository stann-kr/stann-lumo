-- Phase 4-h: Display Settings 통합 테이블
-- gallery_settings는 이미 배포·운영 중이므로 별도 유지
CREATE TABLE IF NOT EXISTS display_settings (
  page     TEXT NOT NULL PRIMARY KEY,  -- 'global'|'home'|'about'|'music'|'events'|'contact'|'link'
  settings TEXT NOT NULL DEFAULT '{}'  -- JSON, 클라이언트 기본값과 shallow merge
);

INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('global', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('home', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('about', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('music', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('events', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('contact', '{}');
INSERT OR IGNORE INTO display_settings (page, settings) VALUES ('link', '{}');
