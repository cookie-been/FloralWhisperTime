package com.floralwhisper.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.common.ApiException;
import java.util.Collections;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class SiteMediaJsonCodec {
  private static final Logger log = LoggerFactory.getLogger(SiteMediaJsonCodec.class);

  private final ObjectMapper objectMapper;

  public SiteMediaJsonCodec(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper == null ? new ObjectMapper() : objectMapper.copy();
  }

  public List<String> read(String value) {
    if (!notBlank(value)) {
      return List.of();
    }
    try {
      List<String> items = objectMapper.readValue(
          value,
          objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
      if (items == null) {
        return List.of();
      }
      return normalize(items);
    } catch (JsonProcessingException exception) {
      log.warn("Failed to parse site media json: {}", value, exception);
      return List.of();
    }
  }

  public String write(List<String> value) {
    List<String> normalized = normalize(value == null ? Collections.emptyList() : value);
    try {
      return objectMapper.writeValueAsString(normalized);
    } catch (JsonProcessingException exception) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "站点媒体配置保存失败");
    }
  }

  private List<String> normalize(List<String> value) {
    return value.stream().filter(this::notBlank).map(String::trim).distinct().toList();
  }

  private boolean notBlank(String value) {
    return value != null && !value.trim().isEmpty();
  }
}
