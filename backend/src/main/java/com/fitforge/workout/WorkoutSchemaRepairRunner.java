package com.fitforge.workout;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Repairs legacy PostgreSQL workout/exercise/plan/set schemas on startup:
 * 1. Drops NOT NULL constraints on legacy columns not required by current JPA entities.
 * 2. Synchronizes pg_get_serial_sequence('<table>', 'id') to COALESCE(MAX(id), 0) + 1.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE - 1)
public class WorkoutSchemaRepairRunner implements ApplicationRunner {
    private static final Logger LOG = LoggerFactory.getLogger(WorkoutSchemaRepairRunner.class);

    private static final List<String> TABLES = List.of(
            "workouts",
            "workout_sessions",
            "workout_exercises",
            "workout_sets",
            "exercises",
            "workout_plans",
            "plan_exercises",
            "custom_workout_exercises",
            "workout_routines",
            "workout_sections",
            "workout_section_exercises",
            "exercise_goals",
            "push_up_logs",
            "exercise_library"
    );

    private static final Set<String> ALWAYS_KEEP_NOT_NULL = Set.of("id", "user_id", "user_email");

    private static final Map<String, Set<String>> REQUIRED_ENTITY_COLUMNS = Map.ofEntries(
            Map.entry("workout_sessions", Set.of("id", "user_email", "name", "session_date")),
            Map.entry("workout_sets", Set.of("id", "user_email", "session_id", "exercise_name", "set_number", "reps", "weight_kg", "rest_seconds", "workout_date")),
            Map.entry("custom_workout_exercises", Set.of("id", "user_email", "name", "muscle_group", "is_deleted")),
            Map.entry("workout_routines", Set.of("id", "user_email", "name", "home_workout", "is_deleted")),
            Map.entry("workout_sections", Set.of("id", "user_email", "name")),
            Map.entry("workout_section_exercises", Set.of("id", "section_id", "exercise_name")),
            Map.entry("exercise_goals", Set.of("id", "user_email", "exercise_name", "target_weight_kg", "target_reps", "deadline_date", "is_deleted")),
            Map.entry("push_up_logs", Set.of("id", "user_email", "repetitions", "duration_seconds", "performed_at")),
            Map.entry("exercise_library", Set.of("id", "name", "muscle_group"))
    );

    private final JdbcTemplate jdbc;
    private final DataSource dataSource;
    private final TransactionTemplate transaction;

    public WorkoutSchemaRepairRunner(
            JdbcTemplate jdbc,
            DataSource dataSource,
            PlatformTransactionManager transactionManager) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isPostgreSql()) return;
        for (String table : TABLES) {
            try {
                if (!tableExists(table)) continue;
                dropLegacyNotNullConstraints(table);
                transaction.executeWithoutResult(status -> synchronizeSequence(table));
            } catch (Exception ex) {
                LOG.warn("Could not complete schema repair for table {}", table, ex);
            }
        }
    }

    private boolean isPostgreSql() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            return metadata != null && "PostgreSQL".equalsIgnoreCase(metadata.getDatabaseProductName());
        } catch (Exception ex) {
            LOG.warn("Could not determine database product; skipping workout schema repair", ex);
            return false;
        }
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?",
                Integer.class,
                table);
        return count != null && count > 0;
    }

    private void dropLegacyNotNullConstraints(String table) {
        List<String> notNullColumns = jdbc.queryForList(
                "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema = current_schema() AND table_name = ? AND is_nullable = 'NO'",
                String.class,
                table);

        Set<String> keep = REQUIRED_ENTITY_COLUMNS.getOrDefault(table, ALWAYS_KEEP_NOT_NULL);
        for (String column : notNullColumns) {
            if (column == null || ALWAYS_KEEP_NOT_NULL.contains(column) || keep.contains(column)) continue;
            // Only safe identifier characters from information_schema.
            if (!column.matches("[a-zA-Z_][a-zA-Z0-9_]*")) continue;
            try {
                jdbc.execute("ALTER TABLE \"" + table + "\" ALTER COLUMN \"" + column + "\" DROP NOT NULL");
                LOG.info("Dropped legacy NOT NULL constraint on {}.{}", table, column);
            } catch (Exception ex) {
                LOG.warn("Could not drop NOT NULL on {}.{}: {}", table, column, ex.getMessage());
            }
        }
    }

    private void synchronizeSequence(String table) {
        String sequence = jdbc.queryForObject(
                "SELECT pg_get_serial_sequence(?, 'id')", String.class, table);
        if (sequence == null || sequence.isBlank()) return;

        jdbc.execute("LOCK TABLE \"" + table + "\" IN ACCESS EXCLUSIVE MODE");
        Long nextId = jdbc.queryForObject(
                "SELECT COALESCE(MAX(id), 0) + 1 FROM \"" + table + "\"", Long.class);
        jdbc.queryForObject("SELECT setval(CAST(? AS regclass), ?, false)", Long.class, sequence, nextId);
        LOG.info("Synchronized PostgreSQL sequence for {} -> next id {}", table, nextId);
    }
}
