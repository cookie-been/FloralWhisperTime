# 高并发防护与高可用预留 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为当前单机单实例部署的花语时光系统补齐入口限流、高成本接口并发隔离、参数治理、热点缓存和过载状态可见性，避免短时大量请求导致服务失稳，并为后续横向扩容保留结构化演进路径。

**Architecture:** 后端新增基于 Bucket4j 的路由分级限流和基于 Semaphore 的高成本接口并发隔离，所有阈值通过 `application.yml + 环境变量` 配置。对公开只读站点配置类接口增加 Caffeine 本地缓存并在后台写操作后主动失效，同时扩展系统状态接口和后台系统页展示保护状态。

**Tech Stack:** Spring Boot 3, MyBatis-Plus, Spring MVC Interceptor, Bucket4j, Caffeine, React 19, TypeScript, Ant Design 6

---

## File Structure

**Create**
- `flower-shop-backend-java/src/main/java/com/floralwhisper/config/ConcurrencyProtectionProperties.java` - 并发保护配置对象，映射限流、并发上限、Tomcat/Hikari 相关阈值
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RouteProtectionGroup.java` - 路由组枚举
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RouteProtectionClassifier.java` - 请求路径到路由组的映射器
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ClientIdentityResolver.java` - 解析客户端 IP / 标识
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitExceededException.java` - 限流异常
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ServiceBusyException.java` - 并发隔离拒绝异常
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitDecision.java` - 限流命中结果 DTO
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ProtectionSnapshot.java` - 系统状态输出的保护摘要 DTO
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ProtectionMetrics.java` - 统计拒绝次数、命中次数
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitService.java` - Bucket4j 本地限流服务
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitInterceptor.java` - Spring MVC 请求限流拦截器
- `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/HeavyOperationGuard.java` - 高成本接口并发隔离服务
- `flower-shop-backend-java/src/main/java/com/floralwhisper/config/ProtectionWebMvcConfigurer.java` - 注册限流拦截器
- `flower-shop-backend-java/src/main/java/com/floralwhisper/config/CacheConfig.java` - Caffeine CacheManager 配置

**Modify**
- `flower-shop-backend-java/pom.xml` - 增加 Bucket4j 与 Caffeine 依赖
- `flower-shop-backend-java/src/main/resources/application.yml` - 增加 Tomcat/Hikari/并发保护配置
- `flower-shop-backend-java/src/main/java/com/floralwhisper/config/AppProperties.java` - 增加 protection 配置段
- `flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java` - 增加 429/503 统一响应
- `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java` - 公开读接口走缓存后的 service；上传接口接入高成本保护
- `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java` - AI 接口接入高成本保护
- `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java` - 配置导入接口接入高成本保护
- `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java` - 只读缓存、后台写后失效、系统状态增加保护摘要
- `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/SystemStatusResponse.java` - 增加保护状态字段
- `flower-shop-web/src/types/index.ts` / `shared/types.ts` - 增加系统保护状态类型
- `flower-shop-web/src/services/api.ts` - 读取扩展后的系统状态结构
- `flower-shop-web/src/pages/AdminSystemStatus/AdminSystemStatus.tsx` - 新增保护状态展示
- `docs/architecture.md` - 增加并发保护与未来扩容描述
- `docs/installation-guide.md` - 增加新的环境变量说明
- `docs/deployment-checklist.md` - 增加限流/并发保护验收项

**Test**
- `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java`
- `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java`
- `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
- `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java`
- `flower-shop-backend-java/src/test/java/com/floralwhisper/protection/RateLimitServiceTest.java`
- `flower-shop-backend-java/src/test/java/com/floralwhisper/protection/HeavyOperationGuardTest.java`

### Task 1: 引入依赖与保护配置骨架

**Files:**
- Modify: `flower-shop-backend-java/pom.xml`
- Modify: `flower-shop-backend-java/src/main/resources/application.yml`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/AppProperties.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/ConcurrencyProtectionProperties.java`

- [ ] **Step 1: 写出配置绑定与依赖的失败测试**

在 `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java` 增加一个最小失败测试，确认新增保护配置对象能提供默认值。

```java
@Test
void protectionDefaultsExposeExpectedThresholds() {
  AppProperties properties = new AppProperties();
  assertEquals(60, properties.getProtection().getPublicRead().getCapacity());
  assertEquals(2, properties.getProtection().getHeavy().getAiConcurrent());
}
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run:

```bash
mvn -Dtest=SiteServiceTest#protectionDefaultsExposeExpectedThresholds test
```

Expected:
- FAIL，提示 `getProtection()` 或相关字段不存在

- [ ] **Step 3: 增加依赖与配置结构**

更新 `pom.xml`：

```xml
<dependency>
  <groupId>com.bucket4j</groupId>
  <artifactId>bucket4j_jdk17-core</artifactId>
  <version>8.14.0</version>
</dependency>
<dependency>
  <groupId>com.github.ben-manes.caffeine</groupId>
  <artifactId>caffeine</artifactId>
</dependency>
```

在 `AppProperties` 中新增：

```java
private Protection protection = new Protection();

@Data
public static class Protection {
  private RouteLimit publicRead = new RouteLimit(60, 10, 0, 0, true);
  private RouteLimit publicWrite = new RouteLimit(12, 60, 0, 0, true);
  private RouteLimit admin = new RouteLimit(30, 60, 0, 0, true);
  private RouteLimit heavy = new RouteLimit(6, 60, 2, 4, true);
  private Integer configImportConcurrent = 1;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public static class RouteLimit {
  private Integer capacity;
  private Integer refillSeconds;
  private Integer aiConcurrent;
  private Integer uploadConcurrent;
  private Boolean enabled;
}
```

在 `application.yml` 中新增：

```yaml
server:
  tomcat:
    threads:
      max: ${SERVER_TOMCAT_THREADS_MAX:80}
    accept-count: ${SERVER_TOMCAT_ACCEPT_COUNT:200}
    max-connections: ${SERVER_TOMCAT_MAX_CONNECTIONS:1000}
    connection-timeout: ${SERVER_TOMCAT_CONNECTION_TIMEOUT:5s}

spring:
  datasource:
    hikari:
      maximum-pool-size: ${DB_MAX_POOL_SIZE:20}
      minimum-idle: ${DB_MIN_IDLE:5}
      connection-timeout: ${DB_CONNECTION_TIMEOUT_MS:3000}
      validation-timeout: ${DB_VALIDATION_TIMEOUT_MS:1000}
      idle-timeout: ${DB_IDLE_TIMEOUT_MS:600000}
      max-lifetime: ${DB_MAX_LIFETIME_MS:1800000}

app:
  protection:
    public-read:
      enabled: ${PROTECTION_PUBLIC_READ_ENABLED:true}
      capacity: ${PROTECTION_PUBLIC_READ_CAPACITY:60}
      refill-seconds: ${PROTECTION_PUBLIC_READ_REFILL_SECONDS:10}
    public-write:
      enabled: ${PROTECTION_PUBLIC_WRITE_ENABLED:true}
      capacity: ${PROTECTION_PUBLIC_WRITE_CAPACITY:12}
      refill-seconds: ${PROTECTION_PUBLIC_WRITE_REFILL_SECONDS:60}
    admin:
      enabled: ${PROTECTION_ADMIN_ENABLED:true}
      capacity: ${PROTECTION_ADMIN_CAPACITY:30}
      refill-seconds: ${PROTECTION_ADMIN_REFILL_SECONDS:60}
    heavy:
      enabled: ${PROTECTION_HEAVY_ENABLED:true}
      capacity: ${PROTECTION_HEAVY_CAPACITY:6}
      refill-seconds: ${PROTECTION_HEAVY_REFILL_SECONDS:60}
      ai-concurrent: ${PROTECTION_HEAVY_AI_CONCURRENT:2}
      upload-concurrent: ${PROTECTION_HEAVY_UPLOAD_CONCURRENT:4}
    config-import-concurrent: ${PROTECTION_CONFIG_IMPORT_CONCURRENT:1}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```bash
mvn -Dtest=SiteServiceTest#protectionDefaultsExposeExpectedThresholds test
```

Expected:
- PASS

- [ ] **Step 5: 提交**

```bash
git add flower-shop-backend-java/pom.xml flower-shop-backend-java/src/main/resources/application.yml flower-shop-backend-java/src/main/java/com/floralwhisper/config/AppProperties.java
git commit -m "增加并发保护基础配置"
```

### Task 2: 实现路由分级限流

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RouteProtectionGroup.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RouteProtectionClassifier.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ClientIdentityResolver.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitDecision.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitExceededException.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ProtectionMetrics.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitService.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/RateLimitInterceptor.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/ProtectionWebMvcConfigurer.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/protection/RateLimitServiceTest.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java`

- [ ] **Step 1: 写限流服务失败测试**

新增 `RateLimitServiceTest`：

```java
@Test
void consumeRejectsWhenBucketIsExhausted() {
  RateLimitService service = createService(2, 60);
  assertTrue(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
  assertTrue(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
  assertFalse(service.tryConsume("127.0.0.1", RouteProtectionGroup.PUBLIC_READ).allowed());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
mvn -Dtest=RateLimitServiceTest#consumeRejectsWhenBucketIsExhausted test
```

Expected:
- FAIL，提示类不存在

- [ ] **Step 3: 实现限流组件**

关键代码骨架：

```java
public enum RouteProtectionGroup {
  PUBLIC_READ, PUBLIC_WRITE, ADMIN, HEAVY, NONE
}
```

```java
public record RateLimitDecision(boolean allowed, long remainingTokens, RouteProtectionGroup group) {}
```

```java
public class RateLimitExceededException extends ApiException {
  public RateLimitExceededException(String message) {
    super(HttpStatus.TOO_MANY_REQUESTS, message);
  }
}
```

```java
@Service
public class RateLimitService {
  private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();

  public RateLimitDecision tryConsume(String clientKey, RouteProtectionGroup group) {
    Bucket bucket = buckets.computeIfAbsent(group + ":" + clientKey, key -> newBucket(group));
    ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
    return new RateLimitDecision(probe.isConsumed(), probe.getRemainingTokens(), group);
  }
}
```

```java
public class RateLimitInterceptor implements HandlerInterceptor {
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    RouteProtectionGroup group = classifier.classify(request);
    if (group == RouteProtectionGroup.NONE) return true;
    RateLimitDecision decision = rateLimitService.tryConsume(identityResolver.resolve(request), group);
    if (!decision.allowed()) {
      throw new RateLimitExceededException(resolveMessage(group));
    }
    return true;
  }
}
```

异常处理：

```java
@ExceptionHandler(RateLimitExceededException.class)
public ResponseEntity<Map<String, String>> handleRateLimitExceeded(RateLimitExceededException error) {
  return ResponseEntity.status(error.getStatus()).body(Map.of("message", error.getMessage()));
}
```

- [ ] **Step 4: 增加控制器级回归测试**

在 `SiteControllerTest` 中新增：

```java
@Test
void publicReadRequestsReturn429WhenRateLimitExceeded() throws Exception {
  for (int i = 0; i < 2; i++) {
    mockMvc.perform(get("/api/site-config")).andExpect(status().isOk());
  }
  mockMvc.perform(get("/api/site-config"))
      .andExpect(status().isTooManyRequests())
      .andExpect(jsonPath("$.message").value("当前请求较多，请稍后重试"));
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
mvn -Dtest=RateLimitServiceTest,SiteControllerTest test
```

Expected:
- PASS

- [ ] **Step 6: 提交**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/protection flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java flower-shop-backend-java/src/main/java/com/floralwhisper/config/ProtectionWebMvcConfigurer.java flower-shop-backend-java/src/test/java/com/floralwhisper/protection/RateLimitServiceTest.java flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java
git commit -m "实现全站路由分级限流"
```

### Task 3: 实现高成本接口并发隔离

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ServiceBusyException.java`
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/HeavyOperationGuard.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/common/GlobalExceptionHandler.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/protection/HeavyOperationGuardTest.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`

- [ ] **Step 1: 写并发隔离失败测试**

```java
@Test
void guardRejectsWhenNoPermitAvailable() {
  HeavyOperationGuard guard = new HeavyOperationGuard(0, 0, 0);
  assertThrows(ServiceBusyException.class, () -> guard.acquireAiPermit());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
mvn -Dtest=HeavyOperationGuardTest#guardRejectsWhenNoPermitAvailable test
```

Expected:
- FAIL，提示类不存在

- [ ] **Step 3: 实现并发隔离器与异常**

```java
public class ServiceBusyException extends ApiException {
  public ServiceBusyException(String message) {
    super(HttpStatus.SERVICE_UNAVAILABLE, message);
  }
}
```

```java
@Service
public class HeavyOperationGuard {
  private final Semaphore aiSemaphore;
  private final Semaphore uploadSemaphore;
  private final Semaphore configImportSemaphore;

  public <T> T executeAi(Supplier<T> action) {
    if (!aiSemaphore.tryAcquire()) {
      throw new ServiceBusyException("当前生成任务较多，请稍后再试");
    }
    try {
      return action.get();
    } finally {
      aiSemaphore.release();
    }
  }
}
```

控制器接入：

```java
return heavyOperationGuard.executeAi(() -> {
  GeneratedAiImageResult generated = volcengineImageGenerationService.generate(normalizedPrompt, files);
  String localUrl = aiGeneratedImageStorageService.downloadToLocal(generated.imageSource());
  return new AiImageGenerateResponse(true, localUrl, generated.source(), generated.mode());
});
```

```java
return heavyOperationGuard.executeUpload(() -> fileStorageService.store(file));
```

```java
return heavyOperationGuard.executeConfigImport(() -> siteService.importConfig(file));
```

- [ ] **Step 4: 增加接口级失败测试**

在 `AdminAiControllerTest` 中加入：

```java
@Test
void generateReturns503WhenAiGuardIsBusy() throws Exception {
  when(heavyOperationGuard.executeAi(any())).thenThrow(new ServiceBusyException("当前生成任务较多，请稍后再试"));
  mockMvc.perform(multipart("/api/admin/ai/images/generate")
      .param("prompt", "春日花束")
      .with(request -> { request.setMethod("POST"); return request; })
      .header("Authorization", "Bearer " + jwtService.createToken("admin")))
      .andExpect(status().isServiceUnavailable())
      .andExpect(jsonPath("$.message").value("当前生成任务较多，请稍后再试"));
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
mvn -Dtest=HeavyOperationGuardTest,AdminAiControllerTest,AdminControllerTest,SiteControllerTest test
```

Expected:
- PASS

- [ ] **Step 6: 提交**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ServiceBusyException.java flower-shop-backend-java/src/main/java/com/floralwhisper/protection/HeavyOperationGuard.java flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminAiController.java flower-shop-backend-java/src/main/java/com/floralwhisper/controller/SiteController.java flower-shop-backend-java/src/main/java/com/floralwhisper/controller/AdminController.java flower-shop-backend-java/src/test/java/com/floralwhisper/protection/HeavyOperationGuardTest.java flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java
git commit -m "实现高成本接口并发隔离"
```

### Task 4: 为公开只读接口增加 Caffeine 缓存和主动失效

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/config/CacheConfig.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java`

- [ ] **Step 1: 写缓存命中失败测试**

```java
@Test
void getSiteConfigUsesCacheForRepeatedReads() {
  SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
  when(siteConfigMapper.selectById(1L)).thenReturn(siteConfigForExport());
  SiteService siteService = createSiteServiceWithCache(siteConfigMapper);

  siteService.getSiteConfig();
  siteService.getSiteConfig();

  verify(siteConfigMapper, times(1)).selectById(1L);
}
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
mvn -Dtest=SiteServiceTest#getSiteConfigUsesCacheForRepeatedReads test
```

Expected:
- FAIL，`selectById` 被调用 2 次

- [ ] **Step 3: 实现缓存与失效**

缓存配置：

```java
@Bean
public CacheManager cacheManager() {
  CaffeineCacheManager manager = new CaffeineCacheManager(
      "siteConfig", "shopInfo", "brandStory", "aboutPage", "aboutTimeline", "team", "categories");
  manager.setCaffeine(Caffeine.newBuilder().expireAfterWrite(Duration.ofSeconds(60)).maximumSize(200));
  return manager;
}
```

`SiteService` 上加缓存：

```java
@Cacheable("siteConfig")
public SiteConfigResponse getSiteConfig() { ... }
```

```java
@CacheEvict(cacheNames = {"siteConfig", "shopInfo", "brandStory"}, allEntries = true)
public SiteConfigUpdateResponse updateSiteConfig(SiteConfigUpdateRequest request) { ... }
```

同理处理：
- `getShopInfo`
- `getBrandStory`
- `getAboutPage`
- `getAboutTimeline`
- `getAdminTeamMembers`
- `getCategories`

- [ ] **Step 4: 增加后台写后失效测试**

```java
@Test
void updateSiteConfigEvictsCachedSiteConfig() {
  siteService.getSiteConfig();
  siteService.updateSiteConfig(request);
  siteService.getSiteConfig();
  verify(siteConfigMapper, times(2)).selectById(1L);
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
mvn -Dtest=SiteServiceTest test
```

Expected:
- PASS

- [ ] **Step 6: 提交**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/config/CacheConfig.java flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java
git commit -m "增加公开只读接口缓存与主动失效"
```

### Task 5: 扩展系统状态输出保护摘要并更新后台页面

**Files:**
- Create: `flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ProtectionSnapshot.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/dto/SystemStatusResponse.java`
- Modify: `flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java`
- Modify: `shared/types.ts`
- Modify: `flower-shop-web/src/types/index.ts`
- Modify: `flower-shop-web/src/pages/AdminSystemStatus/AdminSystemStatus.tsx`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java`
- Test: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`

- [ ] **Step 1: 写系统状态扩展失败测试**

```java
@Test
void systemStatusIncludesProtectionSnapshot() {
  SystemStatusResponse response = siteService.getSystemStatus();
  assertNotNull(response.getProtection());
  assertEquals(60, response.getProtection().getPublicReadCapacity());
}
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
mvn -Dtest=SiteServiceTest#systemStatusIncludesProtectionSnapshot test
```

Expected:
- FAIL，`getProtection()` 不存在

- [ ] **Step 3: 扩展后端 DTO 和状态组装**

新增 DTO：

```java
@Data
public class ProtectionSnapshot {
  private boolean enabled;
  private int publicReadCapacity;
  private int publicWriteCapacity;
  private int adminCapacity;
  private int heavyCapacity;
  private int aiConcurrent;
  private int uploadConcurrent;
  private int configImportConcurrent;
  private long rateLimitedCount;
  private long busyRejectedCount;
}
```

系统状态挂载：

```java
response.setProtection(protectionSnapshotFactory.snapshot());
```

- [ ] **Step 4: 更新前端类型和页面**

在 `shared/types.ts` 中增加：

```ts
export interface ProtectionSnapshot {
  enabled: boolean;
  publicReadCapacity: number;
  publicWriteCapacity: number;
  adminCapacity: number;
  heavyCapacity: number;
  aiConcurrent: number;
  uploadConcurrent: number;
  configImportConcurrent: number;
  rateLimitedCount: number;
  busyRejectedCount: number;
}
```

并在 `SystemStatus` 中增加：

```ts
protection?: ProtectionSnapshot;
```

前端页面增加保护面板，至少展示：
- 基础限流是否启用
- 四组阈值
- 高成本接口并发阈值
- 已拒绝次数

- [ ] **Step 5: 运行双端验证**

Run:

```bash
mvn -Dtest=SiteServiceTest,AdminControllerTest test
PATH=/workspace/FloralWhisperTime/.tools/node-v22.12.0-linux-x64/bin:$PATH npm run build
```

Expected:
- 后端测试 PASS
- 前端构建 PASS

- [ ] **Step 6: 提交**

```bash
git add flower-shop-backend-java/src/main/java/com/floralwhisper/dto/SystemStatusResponse.java flower-shop-backend-java/src/main/java/com/floralwhisper/service/SiteService.java flower-shop-backend-java/src/main/java/com/floralwhisper/protection/ProtectionSnapshot.java shared/types.ts flower-shop-web/src/types/index.ts flower-shop-web/src/pages/AdminSystemStatus/AdminSystemStatus.tsx
git commit -m "增加并发保护状态展示"
```

### Task 6: 更新架构与部署文档

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/installation-guide.md`
- Modify: `docs/deployment-checklist.md`

- [ ] **Step 1: 写文档差异清单**

在草稿中列出必须补充的内容：

```text
- 新增限流与并发隔离能力
- 新增相关环境变量
- 新增上线验收项
```

- [ ] **Step 2: 更新架构文档**

补充：

```md
- 应用内路由分级限流
- AI/上传/配置导入并发隔离
- 公开只读接口本地缓存
- 后续 Redis / 多实例演进路线
```

- [ ] **Step 3: 更新安装与部署文档**

补充环境变量说明：

```md
- PROTECTION_PUBLIC_READ_CAPACITY
- PROTECTION_PUBLIC_WRITE_CAPACITY
- PROTECTION_ADMIN_CAPACITY
- PROTECTION_HEAVY_CAPACITY
- PROTECTION_HEAVY_AI_CONCURRENT
- PROTECTION_HEAVY_UPLOAD_CONCURRENT
- PROTECTION_CONFIG_IMPORT_CONCURRENT
- SERVER_TOMCAT_THREADS_MAX
- DB_MAX_POOL_SIZE
```

- [ ] **Step 4: 更新部署验收清单**

增加验收项：

```md
- 系统状态页能看到并发保护摘要
- 超限请求返回 429
- AI / 上传 / 配置导入并发满时返回 503
- 前端构建通过，后端测试通过
```

- [ ] **Step 5: 提交**

```bash
git add docs/architecture.md docs/installation-guide.md docs/deployment-checklist.md
git commit -m "更新并发保护部署与架构文档"
```

### Task 7: 最终回归与集成提交

**Files:**
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/SiteControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminAiControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/controller/AdminControllerTest.java`
- Modify: `flower-shop-backend-java/src/test/java/com/floralwhisper/service/SiteServiceTest.java`
- Modify: `docs/README.md`

- [ ] **Step 1: 运行后端完整相关测试**

Run:

```bash
mvn -Dtest=SiteControllerTest,AdminAiControllerTest,AdminControllerTest,SiteServiceTest,RateLimitServiceTest,HeavyOperationGuardTest test
```

Expected:
- PASS

- [ ] **Step 2: 运行前端构建**

Run:

```bash
PATH=/workspace/FloralWhisperTime/.tools/node-v22.12.0-linux-x64/bin:$PATH npm run build
```

Expected:
- PASS

- [ ] **Step 3: 更新总览文档**

在 `docs/README.md` 增加一句摘要：

```md
- 系统已具备基础限流、重接口并发隔离和后台保护状态展示能力
```

- [ ] **Step 4: 整体提交**

```bash
git add flower-shop-backend-java flower-shop-web shared docs/README.md
git commit -m "完成高并发防护基础能力建设"
```

## Self-Review

- Spec coverage:
  - 路由分级限流：Task 2
  - 高成本接口并发隔离：Task 3
  - Tomcat/Hikari/配置化：Task 1
  - 只读热点缓存：Task 4
  - 统一过载响应：Task 2 / Task 3
  - 状态可见性：Task 5
  - 文档与扩容预留：Task 6 / Task 7
- Placeholder scan:
  - 无 `TODO` / `TBD` / “后续再定”式占位
- Type consistency:
  - `RouteProtectionGroup`、`RateLimitDecision`、`ProtectionSnapshot`、`HeavyOperationGuard` 命名在全计划中保持一致
