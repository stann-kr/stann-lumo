-- Performance status 네이밍 변경 + CHECK 제약 제거
-- Confirmed→Announced, Pending→TBA
-- CHECK 제약 없는 TEXT로 변경 → 향후 status 값 변경 시 마이그레이션 불필요

-- 1. 새 테이블 생성 (poster_image_id 포함, status CHECK 제약 없음)
CREATE TABLE performances_new (
  id              TEXT NOT NULL PRIMARY KEY,
  date            TEXT NOT NULL,
  venue           TEXT NOT NULL,
  location        TEXT,
  time            TEXT,
  title           TEXT NOT NULL,
  lineup          TEXT,
  ra_event_link   TEXT,
  ra_event_id     TEXT,
  poster_image_id TEXT,
  status          TEXT NOT NULL DEFAULT 'Announced',
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- 2. 기존 데이터 복사 (status 값 매핑 포함)
INSERT INTO performances_new
  SELECT
    id, date, venue, location, time, title, lineup,
    ra_event_link, ra_event_id, poster_image_id,
    CASE status
      WHEN 'Confirmed' THEN 'Announced'
      WHEN 'Pending'   THEN 'TBA'
      ELSE status
    END,
    sort_order
  FROM performances;

-- 3. 기존 테이블 삭제 후 이름 변경
DROP TABLE performances;
ALTER TABLE performances_new RENAME TO performances;
