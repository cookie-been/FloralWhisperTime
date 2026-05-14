package com.floralwhisper.service.ai;

import com.floralwhisper.config.AiImageProperties;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.mapper.AiSettingsMapper;
import org.springframework.stereotype.Service;

@Service
public class AiSettingsResolver {
  private static final long SINGLETON_ID = 1L;

  private final AiImageProperties properties;
  private final AiSettingsMapper aiSettingsMapper;

  public AiSettingsResolver(AiImageProperties properties, AiSettingsMapper aiSettingsMapper) {
    this.properties = properties;
    this.aiSettingsMapper = aiSettingsMapper;
  }

  public ResolvedAiImageSettings resolve() {
    AiSettings current = aiSettingsMapper.selectById(SINGLETON_ID);
    return new ResolvedAiImageSettings(
        current != null && current.getEnabled() != null ? current.getEnabled() : properties.isEnabled(),
        pick(current == null ? null : current.getProvider(), properties.getProvider()),
        pick(current == null ? null : current.getApiKey(), properties.getApiKey()),
        pick(current == null ? null : current.getModel(), properties.getModel()),
        pick(current == null ? null : current.getBaseUrl(), properties.getBaseUrl()),
        pick(current == null ? null : current.getGeneratePath(), properties.getGeneratePath()),
        properties.getMaxReferenceFiles(),
        properties.getMaxReferenceFileSizeBytes(),
        properties.getDownloadSubdir(),
        properties.getRequestTimeoutSeconds(),
        properties.getSize(),
        properties.getResponseFormat(),
        properties.isWatermark());
  }

  private String pick(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value.trim();
  }
}
