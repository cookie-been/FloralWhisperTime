package com.floralwhisper.service.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AiImageProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VolcengineImageGenerationService {
  private final AiImageProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public VolcengineImageGenerationService(AiImageProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(Math.max(5, properties.getRequestTimeoutSeconds())))
        .build();
  }

  public GeneratedAiImageResult generate(String prompt, List<MultipartFile> referenceFiles) {
    if (!properties.isEnabled()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI 图片生成功能未开启");
    }
    if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI 图片生成密钥未配置");
    }

    boolean imageToImage = referenceFiles != null && !referenceFiles.isEmpty();
    String mode = imageToImage ? "image_to_image" : "text_to_image";

    try {
      String payload = objectMapper.writeValueAsString(buildRequestPayload(prompt, referenceFiles));
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(normalizeGenerateUrl()))
          .timeout(Duration.ofSeconds(Math.max(5, properties.getRequestTimeoutSeconds())))
          .header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + properties.getApiKey().trim())
          .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, extractRemoteErrorMessage(response.body()));
      }

      String imageSource = extractImageSource(response.body());
      return new GeneratedAiImageResult(imageSource, mode, properties.getModel());
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI 图片生成请求构造失败");
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 图片生成请求已中断");
    }
  }

  private Map<String, Object> buildRequestPayload(String prompt, List<MultipartFile> referenceFiles) throws IOException {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("model", properties.getModel());
    payload.put("prompt", prompt);
    payload.put("size", properties.getSize());
    payload.put("response_format", properties.getResponseFormat());
    payload.put("watermark", properties.isWatermark());

    if (referenceFiles != null && !referenceFiles.isEmpty()) {
      payload.put("reference_images", referenceFiles.stream().map(this::toDataUrl).toList());
    }

    return payload;
  }

  private String toDataUrl(MultipartFile file) {
    try {
      String contentType = file.getContentType();
      String mimeType = contentType == null || contentType.isBlank() ? "image/png" : contentType;
      String encoded = Base64.getEncoder().encodeToString(file.getBytes());
      return "data:" + mimeType + ";base64," + encoded;
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "参考图读取失败");
    }
  }

  private String extractImageSource(String responseBody) throws IOException {
    JsonNode root = objectMapper.readTree(responseBody);
    JsonNode dataNode = root.path("data");
    if (dataNode.isArray() && !dataNode.isEmpty()) {
      JsonNode first = dataNode.get(0);
      if (first.hasNonNull("url")) {
        return first.get("url").asText();
      }
      if (first.hasNonNull("b64_json")) {
        return "data:image/png;base64," + first.get("b64_json").asText();
      }
      if (first.isTextual()) {
        return first.asText();
      }
    }

    throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成结果解析失败");
  }

  private String extractRemoteErrorMessage(String responseBody) {
    try {
      JsonNode root = objectMapper.readTree(responseBody);
      if (root.hasNonNull("message")) {
        return root.get("message").asText();
      }
      JsonNode errorNode = root.path("error");
      if (errorNode.hasNonNull("message")) {
        return errorNode.get("message").asText();
      }
    } catch (IOException ignored) {
      // ignore parse failure and use fallback
    }
    return "AI 图片生成失败";
  }

  private String normalizeGenerateUrl() {
    String baseUrl = properties.getBaseUrl() == null ? "" : properties.getBaseUrl().trim();
    String path = properties.getGeneratePath() == null ? "" : properties.getGeneratePath().trim();
    if (baseUrl.endsWith("/") && path.startsWith("/")) {
      return baseUrl.substring(0, baseUrl.length() - 1) + path;
    }
    if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
      return baseUrl + "/" + path;
    }
    return baseUrl + path;
  }
}
