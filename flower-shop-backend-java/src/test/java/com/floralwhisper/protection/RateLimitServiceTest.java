package com.floralwhisper.protection;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class RateLimitServiceTest {

  @Test
  void consumeRejectsWhenBucketIsExhausted() {
    RateLimitService service = createService(2, 60);
    assertTrue(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
    assertTrue(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
    assertFalse(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
  }

  private RateLimitService createService(int capacity, int refillSeconds) {
    return new RateLimitService(capacity, refillSeconds);
  }
}
