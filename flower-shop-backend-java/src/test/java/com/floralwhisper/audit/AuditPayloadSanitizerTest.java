package com.floralwhisper.audit;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class AuditPayloadSanitizerTest {

  @Test
  void sanitizeForDisplayMasksSensitiveFieldsEvenWhenJsonIsMalformed() {
    AuditPayloadSanitizer sanitizer = new AuditPayloadSanitizer(new ObjectMapper());

    String sanitized = sanitizer.sanitizeForDisplay("{\"apiKey\":\"secret-123456\"");

    assertTrue(sanitized.contains("\"apiKey\":\"****\""));
    assertFalse(sanitized.contains("secret-123456"));
  }
}
