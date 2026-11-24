-- Widen columns created as varchar(2000) by an earlier schema; ddl-auto=update never alters existing columns.
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN setup TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN brace TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN execution TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN common_mistakes TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN primary_muscles_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN secondary_muscles_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN instructions_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN image_urls_json TYPE text;
