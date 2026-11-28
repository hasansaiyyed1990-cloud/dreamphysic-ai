package com.fitforge.common;

import org.springframework.stereotype.Component;

@Component
public class IdempotencyGuard {
    /**
     * Kept as a compatibility hook for existing controllers. Duplicate request
     * suppression here rejected legitimate repeated entries (for example, two
     * identical sets or meals) and was process-local rather than truly idempotent.
     * Resource-level idempotency belongs in the corresponding service.
     */
    public void check(String userEmail, String scope, Object payload) {
        // Intentionally no-op: repeated valid submissions must not return 409.
    }
}
