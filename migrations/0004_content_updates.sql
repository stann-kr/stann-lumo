-- Last real change of each public detail page, for sitemap <lastmod>.
-- Additive only. The admin saves replace whole lists (tracks and performances are deleted and inserted again,
-- gallery rows are all updated), so a timestamp column on those tables would move on every save. This ledger keeps
-- a fingerprint of the columns a page shows and moves updated_at only when the fingerprint changes; sort_order is
-- left out because saving a list renumbers it. Rows of deleted items stay; the sitemap only reads ids it lists.
-- kind: event (performances.id), track (tracks.id || '/' || lang), track_media (track_id), photo (gallery_photos.id).
-- updated_at is UTC 'YYYY-MM-DD HH:MM:SS', or NULL when the last change is unknown (rows that existed before this
-- migration, except photos, which keep their upload time).
CREATE TABLE IF NOT EXISTS content_updates (
  kind        TEXT NOT NULL,
  id          TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  updated_at  TEXT,
  PRIMARY KEY (kind, id)
);

CREATE TRIGGER IF NOT EXISTS content_updates_event_insert AFTER INSERT ON performances BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'event', NEW.id, json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'event' AND id = NEW.id);
  UPDATE content_updates SET fingerprint = json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw), updated_at = datetime('now')
    WHERE kind = 'event' AND id = NEW.id AND fingerprint IS NOT json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_event_update AFTER UPDATE ON performances BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'event', NEW.id, json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'event' AND id = NEW.id);
  UPDATE content_updates SET fingerprint = json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw), updated_at = datetime('now')
    WHERE kind = 'event' AND id = NEW.id AND fingerprint IS NOT json_array(NEW.date, NEW.venue, NEW.location, NEW.time, NEW.title, NEW.lineup, NEW.ra_event_link, NEW.ra_event_id, NEW.poster_image_id, NEW.status, NEW.ra_venue_id, NEW.ra_country_name, NEW.ra_area_name, NEW.ra_area_id, NEW.ra_address, NEW.ra_cost, NEW.ra_promoter, NEW.ra_venue_link, NEW.ra_has_tickets, NEW.ra_has_barcode, NEW.ra_promoter_id, NEW.ra_lineup_raw);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_track_insert AFTER INSERT ON tracks BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'track', NEW.id || '/' || NEW.lang, json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'track' AND id = NEW.id || '/' || NEW.lang);
  UPDATE content_updates SET fingerprint = json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link), updated_at = datetime('now')
    WHERE kind = 'track' AND id = NEW.id || '/' || NEW.lang AND fingerprint IS NOT json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_track_update AFTER UPDATE ON tracks BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'track', NEW.id || '/' || NEW.lang, json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'track' AND id = NEW.id || '/' || NEW.lang);
  UPDATE content_updates SET fingerprint = json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link), updated_at = datetime('now')
    WHERE kind = 'track' AND id = NEW.id || '/' || NEW.lang AND fingerprint IS NOT json_array(NEW.title, NEW.type, NEW.duration, NEW.year, NEW.platform, NEW.link);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_track_media_insert AFTER INSERT ON track_media BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'track_media', NEW.track_id, json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'track_media' AND id = NEW.track_id);
  UPDATE content_updates SET fingerprint = json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id), updated_at = datetime('now')
    WHERE kind = 'track_media' AND id = NEW.track_id AND fingerprint IS NOT json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_track_media_update AFTER UPDATE ON track_media BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'track_media', NEW.track_id, json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'track_media' AND id = NEW.track_id);
  UPDATE content_updates SET fingerprint = json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id), updated_at = datetime('now')
    WHERE kind = 'track_media' AND id = NEW.track_id AND fingerprint IS NOT json_array(NEW.tracklist, NEW.recorded_on, NEW.cover_image_id);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_photo_insert AFTER INSERT ON gallery_photos BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'photo', NEW.id, json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'photo' AND id = NEW.id);
  UPDATE content_updates SET fingerprint = json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id), updated_at = datetime('now')
    WHERE kind = 'photo' AND id = NEW.id AND fingerprint IS NOT json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id);
END;

CREATE TRIGGER IF NOT EXISTS content_updates_photo_update AFTER UPDATE ON gallery_photos BEGIN
  INSERT INTO content_updates (kind, id, fingerprint, updated_at)
    SELECT 'photo', NEW.id, json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id), datetime('now')
    WHERE NOT EXISTS (SELECT 1 FROM content_updates WHERE kind = 'photo' AND id = NEW.id);
  UPDATE content_updates SET fingerprint = json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id), updated_at = datetime('now')
    WHERE kind = 'photo' AND id = NEW.id AND fingerprint IS NOT json_array(NEW.filename, NEW.mime_type, NEW.alt_text, NEW.caption, NEW.media_type, NEW.focal_x, NEW.focal_y, NEW.video_youtube_id, NEW.video_thumbnail_url, NEW.linked_event_id);
END;

INSERT OR IGNORE INTO content_updates (kind, id, fingerprint, updated_at)
  SELECT 'event', id, json_array(date, venue, location, time, title, lineup, ra_event_link, ra_event_id, poster_image_id, status, ra_venue_id, ra_country_name, ra_area_name, ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets, ra_has_barcode, ra_promoter_id, ra_lineup_raw), NULL FROM performances;
INSERT OR IGNORE INTO content_updates (kind, id, fingerprint, updated_at)
  SELECT 'track', id || '/' || lang, json_array(title, type, duration, year, platform, link), NULL FROM tracks;
INSERT OR IGNORE INTO content_updates (kind, id, fingerprint, updated_at)
  SELECT 'track_media', track_id, json_array(tracklist, recorded_on, cover_image_id), NULL FROM track_media;
INSERT OR IGNORE INTO content_updates (kind, id, fingerprint, updated_at)
  SELECT 'photo', id, json_array(filename, mime_type, alt_text, caption, media_type, focal_x, focal_y, video_youtube_id, video_thumbnail_url, linked_event_id), created_at FROM gallery_photos;
