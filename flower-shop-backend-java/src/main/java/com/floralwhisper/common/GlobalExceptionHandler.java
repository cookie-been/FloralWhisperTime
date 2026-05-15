package com.floralwhisper.common;

import com.floralwhisper.protection.RateLimitExceededException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<Map<String, String>> handleApiException(ApiException error) {
    return ResponseEntity.status(error.getStatus()).body(Map.of("message", error.getMessage()));
  }

  @ExceptionHandler(RateLimitExceededException.class)
  public ResponseEntity<Map<String, String>> handleRateLimitExceeded(RateLimitExceededException error) {
    return ResponseEntity.status(error.getStatus()).body(Map.of("message", error.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, String>> handleValidationException(MethodArgumentNotValidException error) {
    FieldError fieldError = error.getBindingResult().getFieldError();
    String message = fieldError == null ? "参数错误" : fieldError.getDefaultMessage();
    return ResponseEntity.badRequest().body(Map.of("message", message));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<Map<String, String>> handleMessageNotReadable(HttpMessageNotReadableException error) {
    return ResponseEntity.badRequest().body(Map.of("message", "请求参数格式不正确"));
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<Map<String, String>> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException error) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "上传文件不符合要求"));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, String>> handleException(Exception error) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "服务器错误"));
  }
}
