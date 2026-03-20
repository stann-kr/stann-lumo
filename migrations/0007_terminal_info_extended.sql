-- terminal_custom_fields: 동적 키-밸류 필드
CREATE TABLE IF NOT EXISTS terminal_custom_fields (
  id         TEXT    PRIMARY KEY,
  field_key  TEXT    NOT NULL,
  field_value TEXT   NOT NULL DEFAULT '',
  field_type TEXT    NOT NULL DEFAULT 'text',  -- text | url | badge
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- site_config에 터미널 스타일 옵션 컬럼 추가
ALTER TABLE site_config ADD COLUMN terminal_font_size        TEXT    DEFAULT 'md';
ALTER TABLE site_config ADD COLUMN terminal_animation_speed  TEXT    DEFAULT 'normal';
ALTER TABLE site_config ADD COLUMN terminal_prompt_text      TEXT    DEFAULT '>';
ALTER TABLE site_config ADD COLUMN terminal_show_embed       INTEGER DEFAULT 0;
ALTER TABLE site_config ADD COLUMN terminal_embed_height     TEXT    DEFAULT '400px';
