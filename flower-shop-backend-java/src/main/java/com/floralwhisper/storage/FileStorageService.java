package com.floralwhisper.storage;

import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
  private final AppProperties properties;
  private Path uploadDir;

  public FileStorageService(AppProperties properties) {
    this.properties = properties;
  }

  @PostConstruct
  void init() throws IOException {
    uploadDir = Path.of(properties.getUpload().getDir()).toAbsolutePath().normalize();
    Files.createDirectories(uploadDir);
  }

  public Map<String, String> store(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请选择图片文件");
    }
    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "只支持图片文件");
    }
    String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
    String ext = extension(original);
    String filename = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "") + ext;
    try {
      file.transferTo(uploadDir.resolve(filename));
    } catch (IOException error) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "图片保存失败");
    }
    String path = "/uploads/" + filename;
    String publicBaseUrl = properties.getUpload().getPublicBaseUrl();
    return Map.of("url", publicBaseUrl == null || publicBaseUrl.isBlank() ? path : publicBaseUrl + path);
  }

  private String extension(String filename) {
    int index = filename.lastIndexOf('.');
    if (index < 0) return ".jpg";
    String ext = filename.substring(index).toLowerCase(Locale.ROOT);
    return ext.matches("\\.[a-z0-9]{1,8}") ? ext : ".jpg";
  }
}

