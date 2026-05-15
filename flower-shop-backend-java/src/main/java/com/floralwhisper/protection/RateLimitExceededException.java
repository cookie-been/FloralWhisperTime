package com.floralwhisper.protection;

import com.floralwhisper.common.ApiException;
import org.springframework.http.HttpStatus;

public class RateLimitExceededException extends ApiException {
  public RateLimitExceededException(String message) {
    super(HttpStatus.TOO_MANY_REQUESTS, message);
  }
}
