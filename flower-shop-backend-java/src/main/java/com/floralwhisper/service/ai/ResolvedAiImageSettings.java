package com.floralwhisper.service.ai;

public record ResolvedAiImageSettings(
    boolean enabled,
    String provider,
    String apiKey,
    String model,
    String baseUrl,
    String generatePath,
    String size,
    int maxReferenceFiles,
    long maxReferenceFileSizeBytes,
    String downloadSubdir,
    int requestTimeoutSeconds,
    String responseFormat,
    boolean watermark) {}
