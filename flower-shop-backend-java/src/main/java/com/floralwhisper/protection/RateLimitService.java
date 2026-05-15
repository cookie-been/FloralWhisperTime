package com.floralwhisper.protection;

import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.ConcurrencyProtectionProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.Refill;
import java.time.Duration;
import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
  private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();
  private final Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> policies;
  private final ProtectionMetrics protectionMetrics;

  @Autowired
  public RateLimitService(AppProperties properties, ProtectionMetrics protectionMetrics) {
    this(createPolicies(properties.getProtection()), protectionMetrics);
  }

  public RateLimitService(int capacity, int refillSeconds) {
    this(createSinglePolicy(capacity, refillSeconds), new ProtectionMetrics());
  }

  public RateLimitService(
      Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> policies,
      ProtectionMetrics protectionMetrics) {
    this.policies = policies;
    this.protectionMetrics = protectionMetrics;
  }

  public RateLimitDecision tryConsume(String clientKey, RouteProtectionGroup group) {
    if (group == RouteProtectionGroup.NONE) {
      return new RateLimitDecision(true, Long.MAX_VALUE, group);
    }

    ConcurrencyProtectionProperties.RateLimit policy = policies.get(group);
    if (policy == null || Boolean.FALSE.equals(policy.getEnabled())) {
      protectionMetrics.recordAllowed(group);
      return new RateLimitDecision(true, Long.MAX_VALUE, group);
    }

    Bucket bucket = buckets.computeIfAbsent(group + ":" + clientKey, key -> newBucket(policy));
    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
    if (probe.isConsumed()) {
      protectionMetrics.recordAllowed(group);
    } else {
      protectionMetrics.recordRejected(group);
    }
    return new RateLimitDecision(probe.isConsumed(), probe.getRemainingTokens(), group);
  }

  private static Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> createPolicies(
      ConcurrencyProtectionProperties properties) {
    Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> policies =
        new EnumMap<>(RouteProtectionGroup.class);
    policies.put(RouteProtectionGroup.PUBLIC_READ, properties.getPublicRead());
    policies.put(RouteProtectionGroup.PUBLIC_WRITE, properties.getPublicWrite());
    policies.put(RouteProtectionGroup.ADMIN, properties.getAdmin());
    policies.put(RouteProtectionGroup.HEAVY, properties.getHeavy());
    return policies;
  }

  private static Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> createSinglePolicy(
      int capacity,
      int refillSeconds) {
    ConcurrencyProtectionProperties.RateLimit rateLimit =
        new ConcurrencyProtectionProperties.RateLimit(capacity, refillSeconds, true);
    Map<RouteProtectionGroup, ConcurrencyProtectionProperties.RateLimit> policies =
        new EnumMap<>(RouteProtectionGroup.class);
    policies.put(RouteProtectionGroup.PUBLIC_READ, rateLimit);
    policies.put(RouteProtectionGroup.PUBLIC_WRITE, rateLimit);
    policies.put(RouteProtectionGroup.ADMIN, rateLimit);
    policies.put(RouteProtectionGroup.HEAVY, rateLimit);
    return policies;
  }

  private static Bucket newBucket(ConcurrencyProtectionProperties.RateLimit rateLimit) {
    Bandwidth limit = Bandwidth.classic(
        rateLimit.getCapacity(),
        Refill.intervally(rateLimit.getCapacity(), Duration.ofSeconds(rateLimit.getRefillSeconds())));
    return Bucket.builder().addLimit(limit).build();
  }
}
