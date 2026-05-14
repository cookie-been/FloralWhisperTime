package com.floralwhisper.service.ai;

import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AiImageProperties;
import com.floralwhisper.config.AppProperties;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AiGeneratedImageStorageService {
  private final AppProperties appProperties;
  private final AiImageProperties aiImageProperties;
  private final HttpClient httpClient;
  private Path aiUploadDir;

  public AiGeneratedImageStorageService(AppProperties appProperties, AiImageProperties aiImageProperties) {
    this.appProperties = appProperties;
    this.aiImageProperties = aiImageProperties;
    this.httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(Math.max(5, aiImageProperties.getRequestTimeoutSeconds())))
        .build();
  }

  @PostConstruct
  void init() throws IOException {
    aiUploadDir = Path.of(appProperties.getUpload().getDir(), aiImageProperties.getDownloadSubdir()).toAbsolutePath().normalize();
    Files.createDirectories(aiUploadDir);
  }

  public String downloadToLocal(String imageSource) {
    if (imageSource == null || imageSource.isBlank()) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成图片地址为空");
    }

    byte[] content;
    String extension;

    if (imageSource.startsWith("data:image/")) {
      int marker = imageSource.indexOf(";base64,");
      if (marker < 0) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成图片格式无法识别");
      }
      String mimeType = imageSource.substring("data:".length(), marker);
      extension = extensionFromMimeType(mimeType);
      content = Base64.getDecoder().decode(imageSource.substring(marker + ";base64,".length()));
    } else {
      try {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(imageSource))
            .timeout(Duration.ofSeconds(Math.max(5, aiImageProperties.getRequestTimeoutSeconds())))
            .GET()
            .build();
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
          throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成图片下载失败");
        }
        content = response.body();
        extension = extensionFromResponse(imageSource, response.headers().firstValue("Content-Type").orElse(null));
      } catch (IOException error) {
        throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成图片下载失败");
      } catch (InterruptedException error) {
        Thread.currentThread().interrupt();
        throw new ApiException(HttpStatus.BAD_GATEWAY, "AI 生成图片下载已中断");
      }
    }

    String filename = "ai-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "") + extension;
    try {
      Files.write(aiUploadDir.resolve(filename), content);
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AI 生成图片保存失败");
    }

    String relativePath = "/uploads/" + aiImageProperties.getDownloadSubdir() + "/" + filename;
    String publicBaseUrl = appProperties.getUpload().getPublicBaseUrl();
    return publicBaseUrl == null || publicBaseUrl.isBlank() ? relativePath : publicBaseUrl + relativePath;
  }

  private String extensionFromResponse(String imageSource, String contentType) {
    String extension = extensionFromMimeType(contentType);
    if (extension != null) {
      return extension;
    }

    int index = imageSource.lastIndexOf('.');
    if (index < 0) {
      return ".png";
    }
    String suffix = imageSource.substring(index).toLowerCase(Locale.ROOT);
    return suffix.matches("\\.[a-z0-9]{1,8}(\\?.*)?$") ? suffix.replaceAll("\\?.*$", "") : ".png";
  }

  private String extensionFromMimeType(String contentType) {
    if (contentType == null || contentType.isBlank()) {
      return null;
    }
    String normalized = contentType.toLowerCase(Locale.ROOT);
    if (normalized.contains("png")) return ".png";
    if (normalized.contains("jpeg") || normalized.contains("jpg")) return ".jpg";
    if (normalized.contains("webp")) return ".webp";
    if (normalized.contains("gif")) return ".gif";
    return ".png";
  }
}
