package com.floralwhisper.protection;

public record RateLimitDecision(boolean allowed, long remainingTokens, RouteProtectionGroup group) {
}
