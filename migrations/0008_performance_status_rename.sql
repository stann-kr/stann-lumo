-- Performance status 네이밍 변경
-- Confirmed → Announced, Pending → TBA
UPDATE performances SET status = 'Announced' WHERE status = 'Confirmed';
UPDATE performances SET status = 'TBA'       WHERE status = 'Pending';
