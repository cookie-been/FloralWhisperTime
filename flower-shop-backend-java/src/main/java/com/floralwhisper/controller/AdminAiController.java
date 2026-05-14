package com.floralwhisper.controller;

import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.AiFlowerSuggestionRequest;
import com.floralwhisper.dto.AiFlowerSuggestionResponse;
import com.floralwhisper.dto.AiImageGenerateResponse;
import com.floralwhisper.service.ai.AiGeneratedImageStorageService;
import com.floralwhisper.service.ai.AiSettingsResolver;
import com.floralwhisper.service.ai.GeneratedAiImageResult;
import com.floralwhisper.service.ai.VolcengineFlowerSuggestionService;
import com.floralwhisper.service.ai.VolcengineImageGenerationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/ai")
public class AdminAiController {
  private final AiSettingsResolver aiSettingsResolver;
  private final VolcengineImageGenerationService volcengineImageGenerationService;
  private final AiGeneratedImageStorageService aiGeneratedImageStorageService;
  private final VolcengineFlowerSuggestionService volcengineFlowerSuggestionService;

  public AdminAiController(
      AiSettingsResolver aiSettingsResolver,
      VolcengineImageGenerationService volcengineImageGenerationService,
      AiGeneratedImageStorageService aiGeneratedImageStorageService,
      VolcengineFlowerSuggestionService volcengineFlowerSuggestionService) {
    this.aiSettingsResolver = aiSettingsResolver;
    this.volcengineImageGenerationService = volcengineImageGenerationService;
    this.aiGeneratedImageStorageService = aiGeneratedImageStorageService;
    this.volcengineFlowerSuggestionService = volcengineFlowerSuggestionService;
  }

  @PostMapping(value = "/images/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public AiImageGenerateResponse generate(
      @RequestParam("prompt") String prompt,
      @RequestParam(value = "referenceFiles", required = false) List<MultipartFile> referenceFiles) {
    String normalizedPrompt = prompt == null ? "" : prompt.trim();
    if (!StringUtils.hasText(normalizedPrompt)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请输入生成提示词");
    }

    List<MultipartFile> files = referenceFiles == null ? List.of() : referenceFiles.stream().filter(file -> file != null && !file.isEmpty()).toList();
    validateReferenceFiles(files);

    GeneratedAiImageResult generated = volcengineImageGenerationService.generate(normalizedPrompt, files);
    String localUrl = aiGeneratedImageStorageService.downloadToLocal(generated.imageSource());
    return new AiImageGenerateResponse(true, localUrl, generated.source(), generated.mode());
  }

  @PostMapping(value = "/flowers/suggestions", consumes = MediaType.APPLICATION_JSON_VALUE)
  public AiFlowerSuggestionResponse suggest(@Valid @RequestBody AiFlowerSuggestionRequest request) {
    String normalizedPrompt = request.getPrompt() == null ? "" : request.getPrompt().trim();
    if (!StringUtils.hasText(normalizedPrompt)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请输入生成提示词");
    }
    return volcengineFlowerSuggestionService.suggest(normalizedPrompt, request.getImageUrl(), request.getMode());
  }

  private void validateReferenceFiles(List<MultipartFile> files) {
    int maxReferenceFiles = aiSettingsResolver.resolve().maxReferenceFiles();
    long maxReferenceFileSizeBytes = aiSettingsResolver.resolve().maxReferenceFileSizeBytes();
    if (files.size() > maxReferenceFiles) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "参考图最多上传 " + maxReferenceFiles + " 张");
    }

    for (MultipartFile file : files) {
      if (file.getSize() > maxReferenceFileSizeBytes) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "参考图单张大小不能超过 20MB");
      }
      String contentType = file.getContentType();
      if (contentType == null || !contentType.startsWith("image/")) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "参考图仅支持图片文件");
      }
    }
  }
}
