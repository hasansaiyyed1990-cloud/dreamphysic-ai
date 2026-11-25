-- Widen columns created as varchar(2000) by an earlier schema; ddl-auto=update never alters existing columns.
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN setup TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN brace TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN execution TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN common_mistakes TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN primary_muscles_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN secondary_muscles_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN instructions_json TYPE text;
ALTER TABLE IF EXISTS exercise_library ALTER COLUMN image_urls_json TYPE text;
-- Free-text fields previously declared varchar(500..2000); user/AI input can exceed those lengths.
ALTER TABLE IF EXISTS weekly_plan_days ALTER COLUMN plan TYPE text;
ALTER TABLE IF EXISTS physique_check_ins ALTER COLUMN photo_url TYPE text;
ALTER TABLE IF EXISTS physique_check_ins ALTER COLUMN notes TYPE text;
ALTER TABLE IF EXISTS push_up_logs ALTER COLUMN notes TYPE text;
ALTER TABLE IF EXISTS cardio_sessions ALTER COLUMN notes TYPE text;
ALTER TABLE IF EXISTS autopilot_physique_goals ALTER COLUMN goal TYPE text;
ALTER TABLE IF EXISTS autopilot_physique_goals ALTER COLUMN linked_exercises TYPE text;
ALTER TABLE IF EXISTS autopilot_physique_goals ALTER COLUMN next_steps TYPE text;
