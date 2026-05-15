package com.floralwhisper.protection;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {
  private static final String DEFAULT_MESSAGE = "当前请求较多，请稍后重试";

  private final RouteProtectionClassifier classifier;
  private final ClientIdentityResolver identityResolver;
  private final RateLimitService rateLimitService;

  public RateLimitInterceptor(
      RouteProtectionClassifier classifier,
      ClientIdentityResolver identityResolver,
      RateLimitService rateLimitService) {
    this.classifier = classifier;
    this.identityResolver = identityResolver;
    this.rateLimitService = rateLimitService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    RouteProtectionGroup group = classifier.classify(request);
    if (group == RouteProtectionGroup.NONE) {
      return true;
    }

    RateLimitDecision decision = rateLimitService.tryConsume(identityResolver.resolve(request), group);
    if (!decision.allowed()) {
      throw new RateLimitExceededException(resolveMessage(group));
    }
    return true;
  }

  private String resolveMessage(RouteProtectionGroup group) {
    return DEFAULT_MESSAGE;
  }
}
