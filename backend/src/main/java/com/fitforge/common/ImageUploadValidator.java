package com.fitforge.common;

import java.util.Base64;
import java.util.Locale;

public final class ImageUploadValidator {
    public static final int MAX_IMAGE_BYTES = 10 * 1024 * 1024;

    private ImageUploadValidator() {}

    public static byte[] decodeAndValidateBase64(String rawBase64, String declaredMime) {
        if (rawBase64 == null || rawBase64.isBlank()) {
            throw new IllegalArgumentException("Image payload is required");
        }
        String payload = rawBase64.trim();
        String dataUrlMime = null;
        if (payload.startsWith("data:")) {
            int comma = payload.indexOf(',');
            if (comma < 0) throw new IllegalArgumentException("Invalid image data URL");
            String header = payload.substring(5, comma);
            int semi = header.indexOf(';');
            dataUrlMime = (semi >= 0 ? header.substring(0, semi) : header).trim().toLowerCase(Locale.ROOT);
            payload = payload.substring(comma + 1);
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(payload);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid base64 image encoding");
        }
        String effectiveMime = declaredMime != null && !declaredMime.isBlank()
                ? declaredMime.trim().toLowerCase(Locale.ROOT)
                : dataUrlMime;
        validateBytesAndMime(bytes, effectiveMime);
        return bytes;
    }

    public static String validateBytesAndMime(byte[] bytes, String declaredMime) {
        if (bytes == null || bytes.length == 0 || bytes.length > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Choose an image smaller than 10 MB");
        }
        String verified = verifiedImageMime(bytes);
        if (verified == null || (declaredMime != null && !declaredMime.isBlank() && !verified.equalsIgnoreCase(declaredMime.trim()))) {
            throw new IllegalArgumentException("Only valid JPEG, PNG, or WebP images are accepted");
        }
        return verified;
    }

    public static String verifiedImageMime(byte[] b) {
        if (b.length >= 3 && (b[0] & 255) == 255 && (b[1] & 255) == 216 && (b[2] & 255) == 255) return "image/jpeg";
        if (b.length >= 8 && (b[0] & 255) == 137 && b[1] == 80 && b[2] == 78 && b[3] == 71 && b[4] == 13 && b[5] == 10 && b[6] == 26 && b[7] == 10) return "image/png";
        if (b.length >= 12 && b[0] == 82 && b[1] == 73 && b[2] == 70 && b[3] == 70 && b[8] == 87 && b[9] == 69 && b[10] == 66 && b[11] == 80) return "image/webp";
        return null;
    }
}
