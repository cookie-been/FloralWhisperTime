package com.floralwhisper.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Iterator;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AuditPayloadSanitizer {
  private static final Set<String> SENSITIVE_KEYS = Set.of(
      "password",
      "apiKey",
      "api_key",
      "secret",
      "token",
      "authorization",
      "adminPassword",
      "adminAuthSecret");

  private final ObjectMapper objectMapper;

  public AuditPayloadSanitizer(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public String sanitizeForDisplay(String rawJson) {
    if (rawJson == null || rawJson.isBlank()) {
      return "";
    }
    try {
      JsonNode root = objectMapper.readTree(rawJson);
      sanitizeNode(root);
      return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(root);
    } catch (Exception ignored) {
      return rawJson;
    }
  }

  public String sanitizeForSummary(Object payload) {
    if (payload == null) {
      return "";
    }
    try {
      JsonNode root = objectMapper.valueToTree(payload);
      sanitizeNode(root);
      return objectMapper.writeValueAsString(root);
    } catch (JsonProcessingException ignored) {
      return String.valueOf(payload);
    }
  }

  private void sanitizeNode(JsonNode node) {
    if (node == null) {
      return;
    }
    if (node.isObject()) {
      ObjectNode objectNode = (ObjectNode) node;
      Iterator<String> fieldNames = objectNode.fieldNames();
      while (fieldNames.hasNext()) {
        String fieldName = fieldNames.next();
        JsonNode child = objectNode.get(fieldName);
        if (isSensitive(fieldName)) {
          objectNode.put(fieldName, maskValue(child == null ? "" : child.asText()));
          continue;
        }
        sanitizeNode(child);
      }
      return;
    }
    if (node.isArray()) {
      ArrayNode arrayNode = (ArrayNode) node;
      for (JsonNode child : arrayNode) {
        sanitizeNode(child);
      }
    }
  }

  private boolean isSensitive(String key) {
    if (key == null) {
      return false;
    }
    String normalized = key.toLowerCase(Locale.ROOT);
    return SENSITIVE_KEYS.contains(key) || SENSITIVE_KEYS.contains(normalized);
  }

  private String maskValue(String value) {
    if (value == null || value.isBlank()) {
      return "****";
    }
    String trimmed = value.trim();
    if (trimmed.length() <= 6) {
      return "****";
    }
    return trimmed.substring(0, Math.min(4, trimmed.length())) + "****" + trimmed.substring(trimmed.length() - 2);
  }
}
