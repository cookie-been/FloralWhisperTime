package com.floralwhisper.service.ai;

public record ResolvedAiImageSettings(
    boolean enabled,
    String provider,
    String apiKey,
    String model,
    String baseUrl,
    String generatePath,
    int maxReferenceFiles,
    long maxReferenceFileSizeBytes,
    String downloadSubdir,
    int requestTimeoutSeconds,
    String size,
    String responseFormat,
    boolean watermark) {}
