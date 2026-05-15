package com.floralwhisper.protection;

import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.ConcurrencyProtectionProperties;
import java.util.concurrent.Semaphore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class HeavyOperationGuard {
  private static final Permit NOOP_PERMIT = () -> {};

  private final Semaphore aiSemaphore;
  private final Semaphore uploadSemaphore;
  private final Semaphore configImportSemaphore;
  private final ProtectionMetrics protectionMetrics;

  @Autowired
  public HeavyOperationGuard(AppProperties properties, ProtectionMetrics protectionMetrics) {
    this(
        createSemaphore(properties.getProtection().getConcurrency().getAi()),
        createSemaphore(properties.getProtection().getConcurrency().getUpload()),
        createSemaphore(properties.getProtection().getConcurrency().getConfigImport()),
        protectionMetrics);
  }

  public HeavyOperationGuard(int aiMaxConcurrent, int uploadMaxConcurrent, int configImportMaxConcurrent) {
    this(
        new Semaphore(Math.max(aiMaxConcurrent, 0), true),
        new Semaphore(Math.max(uploadMaxConcurrent, 0), true),
        new Semaphore(Math.max(configImportMaxConcurrent, 0), true),
        new ProtectionMetrics());
  }

  private HeavyOperationGuard(
      Semaphore aiSemaphore,
      Semaphore uploadSemaphore,
      Semaphore configImportSemaphore,
      ProtectionMetrics protectionMetrics) {
    this.aiSemaphore = aiSemaphore;
    this.uploadSemaphore = uploadSemaphore;
    this.configImportSemaphore = configImportSemaphore;
    this.protectionMetrics = protectionMetrics;
  }

  public Permit acquireAiPermit() {
    return acquire(aiSemaphore, "当前生成任务较多，请稍后再试");
  }

  public Permit acquireUploadPermit() {
    return acquire(uploadSemaphore, "当前上传任务较多，请稍后再试");
  }

  public Permit acquireConfigImportPermit() {
    return acquire(configImportSemaphore, "当前导入任务较多，请稍后再试");
  }

  private Permit acquire(Semaphore semaphore, String busyMessage) {
    if (semaphore == null) {
      return NOOP_PERMIT;
    }

    if (!semaphore.tryAcquire()) {
      protectionMetrics.recordBusyRejected();
      throw new ServiceBusyException(busyMessage);
    }

    return semaphore::release;
  }

  private static Semaphore createSemaphore(ConcurrencyProtectionProperties.ConcurrencyLimit limit) {
    if (limit == null || Boolean.FALSE.equals(limit.getEnabled())) {
      return null;
    }
    return new Semaphore(limit.getMaxConcurrent(), true);
  }

  @FunctionalInterface
  public interface Permit extends AutoCloseable {
    @Override
    void close();
  }
}
