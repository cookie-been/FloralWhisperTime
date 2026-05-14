package com.floralwhisper.service.ai;

public record ResolvedAiTextSettings(
    boolean enabled,
    String provider,
    String apiKey,
    String baseUrl,
    String textModel,
    String textGeneratePath,
    double textTemperature,
    int textMaxTokens,
    int requestTimeoutSeconds) {}
