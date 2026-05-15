package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.FlowerResponse;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.entity.Flower;
import com.floralwhisper.entity.FlowerImage;
import com.floralwhisper.entity.FlowerMaterial;
import com.floralwhisper.entity.FlowerTag;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.ContactMapper;
import com.floralwhisper.mapper.FlowerImageMapper;
import com.floralwhisper.mapper.FlowerMapper;
import com.floralwhisper.mapper.FlowerMaterialMapper;
import com.floralwhisper.mapper.FlowerTagMapper;
import com.floralwhisper.mapper.OperationLogMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class OperationLogRecoveryServiceTest {

  @Test
  void restoreRejectsMissingLog() {
    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    when(operationLogMapper.selectById(99L)).thenReturn(null);

    OperationLogRecoveryService service = createService(operationLogMapper, mock(OperationLogQueryService.class), mock(AuditLogService.class));

    ApiException error = assertThrows(ApiException.class, () -> service.restore(99L, "恢复"));
    assertEquals("操作日志不存在", error.getMessage());
  }

  @Test
  void restoreRejectsNonRestorableLog() {
    OperationLog log = new OperationLog();
    log.setId(2L);
    log.setTargetType("FLOWER");

    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    OperationLogQueryService queryService = mock(OperationLogQueryService.class);
    when(operationLogMapper.selectById(2L)).thenReturn(log);
    when(queryService.isRestorable(log)).thenReturn(false);

    OperationLogRecoveryService service = createService(operationLogMapper, queryService, mock(AuditLogService.class));

    ApiException error = assertThrows(ApiException.class, () -> service.restore(2L, "恢复"));
    assertEquals("该日志不支持恢复", error.getMessage());
  }

  @Test
  void restoreDeletedFlowerRecreatesRecordAndWritesAuditLog() {
    OperationLog log = new OperationLog();
    log.setId(3L);
    log.setModule("FLOWER");
    log.setAction("DELETE");
    log.setTargetType("FLOWER");
    log.setTargetId("flower_001");
    log.setBeforeSnapshot("{\"id\":\"flower_001\",\"name\":\"晨雾誓约\",\"categoryId\":\"wedding\",\"images\":[\"/uploads/a.jpg\"],\"price\":899,\"description\":\"desc\",\"materials\":[\"白玫瑰\"],\"meaning\":\"mean\",\"tags\":[\"婚礼\"],\"featured\":true,\"sort\":9,\"createdAt\":\"2026-05-15T00:00:00Z\"}");

    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    OperationLogQueryService queryService = mock(OperationLogQueryService.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    FlowerMapper flowerMapper = mock(FlowerMapper.class);
    FlowerImageMapper flowerImageMapper = mock(FlowerImageMapper.class);
    FlowerMaterialMapper flowerMaterialMapper = mock(FlowerMaterialMapper.class);
    FlowerTagMapper flowerTagMapper = mock(FlowerTagMapper.class);
    FlowerService flowerService = mock(FlowerService.class);

    when(operationLogMapper.selectById(3L)).thenReturn(log);
    when(queryService.isRestorable(log)).thenReturn(true);
    when(flowerService.getById("flower_001")).thenThrow(new ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "作品不存在"));
    when(flowerMapper.selectById("flower_001")).thenReturn(null);

    OperationLog restoredLog = new OperationLog();
    restoredLog.setId(10L);
    restoredLog.setAction("RESTORE");
    restoredLog.setRestoredFromLogId(3L);
    when(operationLogMapper.selectOne(any())).thenReturn(restoredLog);

    OperationLogDetailResponse detail = new OperationLogDetailResponse();
    detail.setId(10L);
    detail.setAction("RESTORE");
    when(queryService.getDetail(10L)).thenReturn(detail);

    OperationLogRecoveryService service = new OperationLogRecoveryService(
        operationLogMapper,
        queryService,
        auditLogService,
        new com.fasterxml.jackson.databind.ObjectMapper(),
        flowerMapper,
        flowerImageMapper,
        flowerMaterialMapper,
        flowerTagMapper,
        mock(SiteConfigMapper.class),
        mock(SiteConfigStatMapper.class),
        mock(ShopInfoMapper.class),
        mock(BrandStoryMapper.class),
        mock(BrandStoryImageMapper.class),
        mock(AboutPageMapper.class),
        mock(AboutTimelineEntryMapper.class),
        mock(TeamMemberMapper.class),
        mock(ContactMapper.class),
        mock(AiSettingsMapper.class),
        flowerService,
        mock(SiteService.class));

    OperationLogDetailResponse result = service.restore(3L, "人工恢复");

    assertEquals(10L, result.getId());
    verify(flowerMapper).insert(isA(Flower.class));
    verify(flowerImageMapper).insert(isA(FlowerImage.class));
    verify(flowerMaterialMapper).insert(isA(FlowerMaterial.class));
    verify(flowerTagMapper).insert(isA(FlowerTag.class));
    verify(auditLogService).record(any(AuditLogCommand.class));
  }

  @Test
  void restoreInvalidSnapshotThrowsAndDoesNotWriteAuditLog() {
    OperationLog log = new OperationLog();
    log.setId(4L);
    log.setModule("FLOWER");
    log.setAction("DELETE");
    log.setTargetType("FLOWER");
    log.setTargetId("flower_001");
    log.setBeforeSnapshot("{invalid}");

    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    OperationLogQueryService queryService = mock(OperationLogQueryService.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    when(operationLogMapper.selectById(4L)).thenReturn(log);
    when(queryService.isRestorable(log)).thenReturn(true);

    OperationLogRecoveryService service = createService(operationLogMapper, queryService, auditLogService);

    ApiException error = assertThrows(ApiException.class, () -> service.restore(4L, "人工恢复"));
    assertEquals("日志快照格式无效，无法恢复", error.getMessage());
    verify(auditLogService, never()).record(any(AuditLogCommand.class));
  }

  private OperationLogRecoveryService createService(
      OperationLogMapper operationLogMapper,
      OperationLogQueryService queryService,
      AuditLogService auditLogService) {
    return new OperationLogRecoveryService(
        operationLogMapper,
        queryService,
        auditLogService,
        new com.fasterxml.jackson.databind.ObjectMapper(),
        mock(FlowerMapper.class),
        mock(FlowerImageMapper.class),
        mock(FlowerMaterialMapper.class),
        mock(FlowerTagMapper.class),
        mock(SiteConfigMapper.class),
        mock(SiteConfigStatMapper.class),
        mock(ShopInfoMapper.class),
        mock(BrandStoryMapper.class),
        mock(BrandStoryImageMapper.class),
        mock(AboutPageMapper.class),
        mock(AboutTimelineEntryMapper.class),
        mock(TeamMemberMapper.class),
        mock(ContactMapper.class),
        mock(AiSettingsMapper.class),
        mock(FlowerService.class),
        mock(SiteService.class));
  }

  @SuppressWarnings("unused")
  private FlowerResponse sampleFlower() {
    FlowerResponse response = new FlowerResponse();
    response.setId("flower_001");
    response.setName("晨雾誓约");
    response.setCategoryId("wedding");
    response.setPrice(BigDecimal.valueOf(899));
    response.setDescription("desc");
    response.setMeaning("mean");
    response.setFeatured(true);
    response.setSort(9);
    response.setCreatedAt("2026-05-15T00:00:00Z");
    return response;
  }
}
