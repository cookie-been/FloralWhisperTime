package com.floralwhisper.protection;

import com.floralwhisper.common.ApiException;
import org.springframework.http.HttpStatus;

public class ServiceBusyException extends ApiException {
  public ServiceBusyException(String message) {
    super(HttpStatus.SERVICE_UNAVAILABLE, message);
  }
}
