-- performances 테이블에 포스터 이미지 FK 추가
ALTER TABLE performances ADD COLUMN poster_image_id TEXT;

-- gallery_photos 테이블에 이벤트 연결 ID 추가
ALTER TABLE gallery_photos ADD COLUMN linked_event_id TEXT;

-- 인덱스 (linked_event_id 기반 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_gallery_linked_event
  ON gallery_photos (linked_event_id);
