package com.fitforge.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);
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
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    ResponseEntity<ApiResponse<Void>> status(org.springframework.web.server.ResponseStatusException ex) {
        org.slf4j.MDC.put("errorCode", "HTTP_" + ex.getStatusCode().value());
        return ResponseEntity.status(ex.getStatusCode()).body(ApiResponse.error(ex.getReason()));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiResponse<Void>> serviceUnavailable(IllegalStateException ex) {
        org.slf4j.MDC.put("errorCode", "SERVICE_UNAVAILABLE");
        String message = ex.getMessage();
        if (message == null || message.isBlank()) message = "AI service is temporarily unavailable; please retry shortly";
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(ApiResponse.error(message));
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
        boolean tooLong = String.valueOf(ex.getMostSpecificCause().getMessage()).contains("too long");
        return ResponseEntity.status(tooLong ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT)
                .body(ApiResponse.error(tooLong ? "A text field is too long" : "Conflicts with existing data"));
    }

    @ExceptionHandler(org.hibernate.exception.DataException.class)
    ResponseEntity<ApiResponse<Void>> dataException(org.hibernate.exception.DataException ex) {
        LOG.warn("Invalid data", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error("A text field is too long or a value is out of range"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiResponse<Void>> unexpected(Exception ex) {
        LOG.error("Unhandled exception", ex);
        return ResponseEntity.internalServerError().body(ApiResponse.error("Internal server error"));
    }
}
