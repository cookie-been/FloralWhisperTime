package com.floralwhisper.service.ai;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.AiFlowerSuggestionResponse;
import com.floralwhisper.entity.Category;
import com.floralwhisper.mapper.CategoryMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class VolcengineFlowerSuggestionService {
  private static final int MAX_NAME_LENGTH = 40;
  private static final int MAX_DESCRIPTION_LENGTH = 240;
  private static final int MAX_MEANING_LENGTH = 120;
  private static final int MAX_ARRAY_ITEM_LENGTH = 20;
  private static final int MAX_ARRAY_ITEMS = 8;

  private final AiSettingsResolver aiSettingsResolver;
  private final CategoryMapper categoryMapper;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public VolcengineFlowerSuggestionService(
      AiSettingsResolver aiSettingsResolver,
      CategoryMapper categoryMapper,
      ObjectMapper objectMapper) {
    this.aiSettingsResolver = aiSettingsResolver;
    this.categoryMapper = categoryMapper;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(120))
        .build();
  }

  public AiFlowerSuggestionResponse suggest(String prompt, String imageUrl, String mode) {
    ResolvedAiTextSettings settings = aiSettingsResolver.resolveText();
    if (!settings.enabled()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI 作品信息建议功能未开启");
    }
    if (settings.apiKey() == null || settings.apiKey().isBlank()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI 作品信息建议密钥未配置");
    }
    if (settings.textModel() == null || settings.textModel().isBlank()) {
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI 作品信息建议模型未配置");
    }

    List<Category> categories = categoryMapper.selectList(new LambdaQueryWrapper<Category>().orderByDesc(Category::getSort));
    if (categories.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "当前没有可用分类，无法生成作品信息建议");
    }

    try {
      String payload = objectMapper.writeValueAsString(buildRequestPayload(settings, prompt, imageUrl, mode, categories));
      HttpRequest request = HttpRequest.newBuilder()
          .uri(URI.create(normalizeUrl(settings.baseUrl(), settings.textGeneratePath())))
          .timeout(Duration.ofSeconds(Math.max(5, settings.requestTimeoutSeconds())))
          .header("Content-Type", "application/json")
          .header("Authorization", "Bearer " + settings.apiKey().trim())
          .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
          .build();

      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, extractRemoteErrorMessage(response.body()));
      }
      return normalizeSuggestion(extractSuggestionJson(response.body()), categories);
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI 作品信息建议请求构造失败");
    } catch (InterruptedException error) {
      Thread.currentThread().interrupt();
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 作品信息建议请求已中断");
    }
  }

  private Map<String, Object> buildRequestPayload(
      ResolvedAiTextSettings settings,
      String prompt,
      String imageUrl,
      String mode,
      List<Category> categories) {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("model", settings.textModel());
    payload.put("temperature", settings.textTemperature());
    payload.put("max_tokens", settings.textMaxTokens());
    payload.put("response_format", Map.of("type", "json_object"));
    payload.put("messages", List.of(
        Map.of("role", "system", "content", buildSystemPrompt(categories)),
        Map.of("role", "user", "content", buildUserPrompt(prompt, imageUrl, mode))));
    return payload;
  }

  private String buildSystemPrompt(List<Category> categories) {
    String categoryText = categories.stream()
        .map(category -> category.getId() + ":" + category.getName())
        .reduce((left, right) -> left + "；" + right)
        .orElse("");
    return """
        你是鲜花店后台的作品编辑助手。请根据管理员提供的生图提示词，为作品生成适合录入作品库的结构化信息。
        只允许返回一个 JSON 对象，禁止输出解释、markdown、代码块。
        JSON 字段固定为：
        name: 字符串
        categoryId: 字符串，必须从这些分类中选择：%s
        description: 字符串，适合前台展示的设计描述
        materials: 字符串数组，列出主要花材
        tags: 字符串数组，列出检索标签
        meaning: 字符串，概括花语寓意
        要求：
        - 名称简洁，有商品感
        - 描述自然专业，不要夸张营销
        - 花材和标签不要重复，不要返回空字符串
        - 如果无法判断分类，返回空字符串
        """.formatted(categoryText);
  }

  private String buildUserPrompt(String prompt, String imageUrl, String mode) {
    String normalizedMode = mode == null || mode.isBlank() ? "text_to_image" : mode.trim();
    String normalizedImageUrl = imageUrl == null ? "" : imageUrl.trim();
    return """
        管理员提示词：
        %s

        生成模式：%s
        生成结果图片地址：%s

        请基于提示词为这件花艺作品生成后台录入建议信息。
        """.formatted(prompt, normalizedMode, normalizedImageUrl);
  }

  private AiFlowerSuggestionResponse extractSuggestionJson(String responseBody) throws IOException {
    JsonNode root = objectMapper.readTree(responseBody);
    JsonNode choices = root.path("choices");
    if (!choices.isArray() || choices.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 作品信息建议解析失败");
    }
    String content = choices.get(0).path("message").path("content").asText("");
    if (content.isBlank()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 作品信息建议解析失败");
    }

    String jsonText = extractJsonObject(content);
    try {
      return objectMapper.readValue(jsonText, new TypeReference<>() {});
    } catch (IOException error) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 作品信息建议解析失败");
    }
  }

  private String extractJsonObject(String content) {
    int start = content.indexOf('{');
    int end = content.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return content.substring(start, end + 1);
    }
    return content;
  }

  private AiFlowerSuggestionResponse normalizeSuggestion(AiFlowerSuggestionResponse response, List<Category> categories) {
    Map<String, Category> categoryMap = new LinkedHashMap<>();
    for (Category category : categories) {
      categoryMap.put(category.getId(), category);
    }

    String categoryId = safeText(response.getCategoryId(), 40);
    if (!categoryMap.containsKey(categoryId)) {
      categoryId = "";
    }

    return new AiFlowerSuggestionResponse(
        safeText(response.getName(), MAX_NAME_LENGTH),
        categoryId,
        safeText(response.getDescription(), MAX_DESCRIPTION_LENGTH),
        normalizeArray(response.getMaterials()),
        normalizeArray(response.getTags()),
        safeText(response.getMeaning(), MAX_MEANING_LENGTH));
  }

  private List<String> normalizeArray(List<String> values) {
    if (values == null || values.isEmpty()) {
      return List.of();
    }
    LinkedHashSet<String> items = new LinkedHashSet<>();
    for (String value : values) {
      String normalized = safeText(value, MAX_ARRAY_ITEM_LENGTH);
      if (!normalized.isBlank()) {
        items.add(normalized);
      }
      if (items.size() >= MAX_ARRAY_ITEMS) {
        break;
      }
    }
    return new ArrayList<>(items);
  }

  private String safeText(String value, int maxLength) {
    if (value == null) {
      return "";
    }
    String normalized = value.trim();
    if (normalized.length() <= maxLength) {
      return normalized;
    }
    return normalized.substring(0, maxLength).trim();
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
    return "AI 作品信息建议失败";
  }

  private String normalizeUrl(String baseUrl, String path) {
    String normalizedBaseUrl = baseUrl == null ? "" : baseUrl.trim();
    String normalizedPath = path == null ? "" : path.trim();
    if (normalizedBaseUrl.endsWith("/") && normalizedPath.startsWith("/")) {
      return normalizedBaseUrl.substring(0, normalizedBaseUrl.length() - 1) + normalizedPath;
    }
    if (!normalizedBaseUrl.endsWith("/") && !normalizedPath.startsWith("/")) {
      return normalizedBaseUrl + "/" + normalizedPath;
    }
    return normalizedBaseUrl + normalizedPath;
  }
}
