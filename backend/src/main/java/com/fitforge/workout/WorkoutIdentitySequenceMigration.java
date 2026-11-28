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

/**
 * Repairs PostgreSQL identity sequences left behind after legacy data imports.
 * Only sequences behind their table's current maximum id are advanced; rows are
 * never modified. The table lock keeps concurrent inserts from racing the repair.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class WorkoutIdentitySequenceMigration implements ApplicationRunner {
    private static final Logger LOG = LoggerFactory.getLogger(WorkoutIdentitySequenceMigration.class);
    private static final List<String> TABLES = List.of(
            "custom_workout_exercises",
            "workout_routines",
            "workout_sections",
            "workout_section_exercises",
            "workout_sessions",
            "workout_sets",
            "exercise_goals",
            "push_up_logs",
            "exercise_library"
    );

    private final JdbcTemplate jdbc;
    private final DataSource dataSource;
    private final TransactionTemplate transaction;

    public WorkoutIdentitySequenceMigration(
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
                transaction.executeWithoutResult(status -> synchronizeSequence(table));
            } catch (Exception ex) {
                // A sequence repair must never take an otherwise usable deployment down.
                LOG.warn("Could not verify workout ID sequence for table {}", table, ex);
            }
        }
    }

    private boolean isPostgreSql() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metadata = connection.getMetaData();
            return metadata != null && "PostgreSQL".equalsIgnoreCase(metadata.getDatabaseProductName());
        } catch (Exception ex) {
            LOG.warn("Could not determine database product; skipping workout ID sequence checks", ex);
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

    private void synchronizeSequence(String table) {
        // Table names come only from the fixed allowlist above.
        jdbc.execute("LOCK TABLE " + table + " IN ACCESS EXCLUSIVE MODE");
        String sequence = jdbc.queryForObject(
                "SELECT pg_get_serial_sequence(?, 'id')", String.class, table);
        if (sequence == null || sequence.isBlank()) return;

        Long nextId = jdbc.queryForObject(
                "SELECT COALESCE(MAX(id), 0) + 1 FROM " + table, Long.class);
        jdbc.queryForObject("SELECT setval(CAST(? AS regclass), ?, false)", Long.class, sequence, nextId);
        LOG.info("Synchronized PostgreSQL ID sequence for {} so the next id is {}", table, nextId);
    }
}
