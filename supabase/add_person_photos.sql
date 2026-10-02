-- Adds player photos. Run this once in the SQL Editor, after
-- schema.sql. Safe to run more than once.
alter table people add column if not exists photo text;
