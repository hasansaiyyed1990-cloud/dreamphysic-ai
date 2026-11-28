package com.fitforge.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);

    // Fragments that only appear in SQL, ORM or stack traces; such messages are never echoed.
    private static final List<String> INTERNAL_MARKERS = List.of(
            "sqlexception", "sqlstate", "sql state", "org.postgresql", "org.hibernate", "java.sql",
            "jdbc", "select ", "insert into", "delete from", "constraint", "caused by", "\tat ",
            "\n", "\r", "stacktrace");

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<Map<String, String>>> validation(MethodArgumentNotValidException ex) {
        org.slf4j.MDC.put("errorCode", "VALIDATION_ERROR");
        var errors = ex.getBindingResult().getFieldErrors().stream().collect(Collectors.toMap(
                e -> e.getField(), e -> e.getDefaultMessage() == null ? "Invalid value" : e.getDefaultMessage(), (a, b) -> a));
        return ResponseEntity.badRequest().body(ApiResponse.error("Validation failed: " + errors));
    }

    @ExceptionHandler(BadCredentialsException.class)
    ResponseEntity<ApiResponse<Void>> badCredentials() {
        org.slf4j.MDC.put("errorCode", "BAD_CREDENTIALS");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Invalid email or password"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<ApiResponse<Void>> badRequest(IllegalArgumentException ex) {
        org.slf4j.MDC.put("errorCode", "BAD_REQUEST");
        return ResponseEntity.badRequest().body(ApiResponse.error(safeMessage(ex.getMessage(), "Invalid request value")));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    ResponseEntity<ApiResponse<Void>> status(org.springframework.web.server.ResponseStatusException ex) {
        org.slf4j.MDC.put("errorCode", "HTTP_" + ex.getStatusCode().value());
        return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.error(safeMessage(ex.getReason(), "Request failed")));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiResponse<Void>> serviceUnavailable(IllegalStateException ex) {
        org.slf4j.MDC.put("errorCode", "SERVICE_UNAVAILABLE");
        String fallback = "Service is temporarily unavailable; please retry shortly";
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.error(safeMessage(ex.getMessage(), fallback)));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse<Void>> uploadTooLarge() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error("Upload exceeds the 10 MB limit"));
    }

    @ExceptionHandler(org.springframework.web.client.ResourceAccessException.class)
    ResponseEntity<ApiResponse<Void>> upstreamTimeout() {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.error("AI service timed out; please retry shortly"));
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            jakarta.validation.ConstraintViolationException.class})
    ResponseEntity<ApiResponse<Void>> malformed(Exception ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error("Malformed or invalid request"));
    }

    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiResponse<Void>> method(Exception ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.error("Method not allowed"));
    }

    @ExceptionHandler({org.springframework.web.servlet.resource.NoResourceFoundException.class,
            org.springframework.web.servlet.NoHandlerFoundException.class})
    ResponseEntity<ApiResponse<Void>> notFound(Exception ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error("Not found"));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<Void>> integrity(org.springframework.dao.DataIntegrityViolationException ex) {
        LOG.warn("Data integrity violation", ex);
        Throwable cause = ex.getMostSpecificCause();
        String causeMessage = cause == null || cause.getMessage() == null ? "" : cause.getMessage();
        boolean tooLong = causeMessage.contains("too long");
        if (tooLong) {
            return ResponseEntity.badRequest().body(ApiResponse.error("A text field is too long"));
        }
        String detail = constraintDetail(ex, causeMessage);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(detail.isBlank() ? "Conflicts with existing data" : "Conflicts with existing data: " + detail));
    }

    private static String constraintDetail(Throwable ex, String causeMessage) {
        for (Throwable current = ex; current != null; current = current.getCause()) {
            if (current instanceof org.hibernate.exception.ConstraintViolationException violation
                    && violation.getConstraintName() != null && !violation.getConstraintName().isBlank()) {
                return "constraint " + violation.getConstraintName();
            }
        }
        if (causeMessage.isBlank()) return "";
        String detail = causeMessage.replaceAll("\\s+", " ").strip();
        if (detail.length() > 180) detail = detail.substring(0, 180);
        return detail;
    }

    @ExceptionHandler(org.hibernate.exception.DataException.class)
    ResponseEntity<ApiResponse<Void>> dataException(org.hibernate.exception.DataException ex) {
        LOG.warn("Invalid data", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error("A text field is too long or a value is out of range"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unexpected(Exception ex) {
        LOG.error("Unhandled API error", ex);
        Throwable root = rootCause(ex);
        String message = root.getMessage() == null ? "" : root.getMessage();
        String detail = root.getClass().getSimpleName() + (message.isBlank() ? "" : " - " + message);
        return ResponseEntity.internalServerError().body(ApiResponse.error("Internal server error: " + detail));
    }

    private static Throwable rootCause(Throwable ex) {
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root;
    }

    /** Returns the message only when it is a short, user-facing value with no SQL/stack-trace content. */
    private static String safeMessage(String message, String fallback) {
        if (message == null || message.isBlank()) return fallback;
        String value = message.strip();
        if (value.length() > 200) return fallback;
        String lower = value.toLowerCase(Locale.ROOT);
        for (String marker : INTERNAL_MARKERS) {
            if (lower.contains(marker)) return fallback;
        }
        return value;
    }
}
