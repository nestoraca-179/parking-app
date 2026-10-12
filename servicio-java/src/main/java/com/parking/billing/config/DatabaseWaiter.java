package com.parking.billing.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class DatabaseWaiter {

    private static final Logger LOGGER = LoggerFactory.getLogger(DatabaseWaiter.class);
    private static final int MAX_ATTEMPTS = 30;
    private static final long RETRY_DELAY_MILLIS = 2000;

    private DatabaseWaiter() {
    }

    public static void awaitConnection() {
        String url = System.getenv("SPRING_DATASOURCE_URL");
        if (url == null) {
            return;
        }
        String username = System.getenv("SPRING_DATASOURCE_USERNAME");
        String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try (Connection ignored = DriverManager.getConnection(url, username, password)) {
                return;
            } catch (SQLException exception) {
                LOGGER.warn("Database attempt {}/{} failed: {}", attempt, MAX_ATTEMPTS, exception.getMessage());
                if (attempt == MAX_ATTEMPTS) {
                    throw new IllegalStateException("Database is not reachable", exception);
                }
                pause();
            }
        }
    }

    private static void pause() {
        try {
            Thread.sleep(RETRY_DELAY_MILLIS);
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for the database", interrupted);
        }
    }
}
