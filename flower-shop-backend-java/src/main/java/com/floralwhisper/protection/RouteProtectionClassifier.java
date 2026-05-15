package com.floralwhisper.protection;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class RouteProtectionClassifier {
  private static final List<String> PUBLIC_READ_EXACT_PATHS = List.of(
      "/api/health",
      "/api/categories",
      "/api/site-config",
      "/api/shop-info",
      "/api/brand-story",
      "/api/about-page",
      "/api/about-timeline",
      "/api/team");

  public RouteProtectionGroup classify(HttpServletRequest request) {
    String method = request.getMethod();
    String path = request.getRequestURI();

    if (matchesHeavy(method, path)) {
      return RouteProtectionGroup.HEAVY;
    }

    if (matchesAdmin(path)) {
      return RouteProtectionGroup.ADMIN;
    }

    if ("POST".equals(method) && "/api/contact".equals(path)) {
      return RouteProtectionGroup.PUBLIC_WRITE;
    }

    if ("GET".equals(method) && matchesPublicRead(path)) {
      return RouteProtectionGroup.PUBLIC_READ;
    }

    return RouteProtectionGroup.NONE;
  }

  private boolean matchesHeavy(String method, String path) {
    return ("POST".equals(method) && "/api/uploads".equals(path))
        || ("POST".equals(method) && "/api/admin/system/config-import".equals(path))
        || path.startsWith("/api/admin/ai/");
  }

  private boolean matchesAdmin(String path) {
    return path.startsWith("/api/admin/");
  }

  private boolean matchesPublicRead(String path) {
    if (PUBLIC_READ_EXACT_PATHS.contains(path)) {
      return true;
    }

    return "/api/flowers".equals(path) || path.startsWith("/api/flowers/");
  }
}
