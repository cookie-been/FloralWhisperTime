package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.FlowerResponse;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.entity.AboutPage;
import com.floralwhisper.entity.AboutTimelineEntry;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.Flower;
import com.floralwhisper.entity.FlowerImage;
import com.floralwhisper.entity.FlowerMaterial;
import com.floralwhisper.entity.FlowerTag;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
import com.floralwhisper.entity.TeamMember;
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
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OperationLogRecoveryService {
  private static final long SINGLETON_ID = 1L;

  private final OperationLogMapper operationLogMapper;
  private final OperationLogQueryService operationLogQueryService;
  private final AuditLogService auditLogService;
  private final ObjectMapper objectMapper;
  private final FlowerMapper flowerMapper;
  private final FlowerImageMapper flowerImageMapper;
  private final FlowerMaterialMapper flowerMaterialMapper;
  private final FlowerTagMapper flowerTagMapper;
  private final SiteConfigMapper siteConfigMapper;
  private final SiteConfigStatMapper siteConfigStatMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final BrandStoryMapper brandStoryMapper;
  private final BrandStoryImageMapper brandStoryImageMapper;
  private final AboutPageMapper aboutPageMapper;
  private final AboutTimelineEntryMapper aboutTimelineEntryMapper;
  private final TeamMemberMapper teamMemberMapper;
  private final ContactMapper contactMapper;
  private final AiSettingsMapper aiSettingsMapper;
  private final FlowerService flowerService;
  private final SiteService siteService;

  public OperationLogRecoveryService(
      OperationLogMapper operationLogMapper,
      OperationLogQueryService operationLogQueryService,
      AuditLogService auditLogService,
      ObjectMapper objectMapper,
      FlowerMapper flowerMapper,
      FlowerImageMapper flowerImageMapper,
      FlowerMaterialMapper flowerMaterialMapper,
      FlowerTagMapper flowerTagMapper,
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
      ShopInfoMapper shopInfoMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      AboutPageMapper aboutPageMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      TeamMemberMapper teamMemberMapper,
      ContactMapper contactMapper,
      AiSettingsMapper aiSettingsMapper,
      FlowerService flowerService,
      SiteService siteService) {
    this.operationLogMapper = operationLogMapper;
    this.operationLogQueryService = operationLogQueryService;
    this.auditLogService = auditLogService;
    this.objectMapper = objectMapper;
    this.flowerMapper = flowerMapper;
    this.flowerImageMapper = flowerImageMapper;
    this.flowerMaterialMapper = flowerMaterialMapper;
    this.flowerTagMapper = flowerTagMapper;
    this.siteConfigMapper = siteConfigMapper;
    this.siteConfigStatMapper = siteConfigStatMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.brandStoryMapper = brandStoryMapper;
    this.brandStoryImageMapper = brandStoryImageMapper;
    this.aboutPageMapper = aboutPageMapper;
    this.aboutTimelineEntryMapper = aboutTimelineEntryMapper;
    this.teamMemberMapper = teamMemberMapper;
    this.contactMapper = contactMapper;
    this.aiSettingsMapper = aiSettingsMapper;
    this.flowerService = flowerService;
    this.siteService = siteService;
  }

  @Transactional
  public OperationLogDetailResponse restore(Long logId, String reason) {
    OperationLog log = operationLogMapper.selectById(logId);
    if (log == null) {
      auditLogService.record(AuditLogCommand.builder()
          .module("AUDIT")
          .action("RESTORE")
          .targetType("OPERATION_LOG")
          .targetId(String.valueOf(logId))
          .requestSummary(java.util.Map.of("sourceLogId", logId, "reason", reason == null ? "" : reason.trim()))
          .success(false)
          .errorMessage("操作日志不存在")
          .build());
      throw new ApiException(HttpStatus.NOT_FOUND, "操作日志不存在");
    }
    Object beforeRestore = null;
    try {
      if (!operationLogQueryService.isRestorable(log)) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "该日志不支持恢复");
      }

      beforeRestore = captureCurrentState(log);
      applyBeforeSnapshot(log);
      Object afterRestore = captureCurrentState(log);

      auditLogService.record(AuditLogCommand.builder()
          .module(log.getModule())
          .action("RESTORE")
          .targetType(log.getTargetType())
          .targetId(log.getTargetId())
          .requestSummary(java.util.Map.of("sourceLogId", logId, "reason", reason == null ? "" : reason.trim()))
          .beforeSnapshot(beforeRestore)
          .afterSnapshot(afterRestore)
          .success(true)
          .restoredFromLogId(logId)
          .build());

      OperationLog latest = operationLogMapper.selectOne(new LambdaQueryWrapper<OperationLog>()
          .eq(OperationLog::getRestoredFromLogId, logId)
          .eq(OperationLog::getAction, "RESTORE")
          .orderByDesc(OperationLog::getId)
          .last("LIMIT 1"));
      return operationLogQueryService.getDetail(latest == null ? logId : latest.getId());
    } catch (RuntimeException error) {
      auditLogService.record(AuditLogCommand.builder()
          .module(log.getModule() == null || log.getModule().isBlank() ? "AUDIT" : log.getModule())
          .action("RESTORE")
          .targetType(log.getTargetType() == null || log.getTargetType().isBlank() ? "OPERATION_LOG" : log.getTargetType())
          .targetId(log.getTargetId() == null || log.getTargetId().isBlank() ? String.valueOf(logId) : log.getTargetId())
          .requestSummary(java.util.Map.of("sourceLogId", logId, "reason", reason == null ? "" : reason.trim()))
          .beforeSnapshot(beforeRestore)
          .success(false)
          .errorMessage(error.getMessage())
          .restoredFromLogId(logId)
          .build());
      throw error;
    }
  }

  private Object captureCurrentState(OperationLog log) {
    return switch (log.getTargetType()) {
      case "FLOWER" -> findFlower(log.getTargetId());
      case "SITE_CONFIG" -> currentSiteConfigSnapshot();
      case "ABOUT_PAGE" -> siteService.getAboutPage();
      case "ABOUT_TIMELINE" -> findTimeline(log.getTargetId());
      case "TEAM_MEMBER" -> teamMemberMapper.selectById(log.getTargetId());
      case "CONTACT" -> contactMapper.selectById(log.getTargetId());
      case "AI_SETTINGS" -> aiSettingsMapper.selectById(SINGLETON_ID);
      default -> null;
    };
  }

  private void applyBeforeSnapshot(OperationLog log) {
    String snapshot = log.getBeforeSnapshot();
    switch (log.getTargetType()) {
      case "FLOWER" -> restoreFlower(log.getTargetId(), snapshot);
      case "SITE_CONFIG" -> restoreSiteConfig(snapshot);
      case "ABOUT_PAGE" -> restoreAboutPage(snapshot);
      case "ABOUT_TIMELINE" -> restoreTimeline(log.getTargetId(), snapshot);
      case "TEAM_MEMBER" -> restoreTeamMember(log.getTargetId(), snapshot);
      case "CONTACT" -> restoreContact(log.getTargetId(), snapshot);
      case "AI_SETTINGS" -> restoreAiSettings(snapshot);
      default -> throw new ApiException(HttpStatus.BAD_REQUEST, "暂不支持该类型的恢复");
    }
  }

  private FlowerResponse findFlower(String id) {
    try {
      return flowerService.getById(id);
    } catch (ApiException error) {
      if (error.getStatus() == HttpStatus.NOT_FOUND) {
        return null;
      }
      throw error;
    }
  }

  private AboutTimelineEntryResponse findTimeline(String id) {
    return siteService.getAboutTimeline().stream().filter(item -> id.equals(item.getId())).findFirst().orElse(null);
  }

  private SiteConfigUpdateResponse currentSiteConfigSnapshot() {
    return new SiteConfigUpdateResponse(siteService.getSiteConfig(), siteService.getShopInfo(), siteService.getBrandStory());
  }

  private void restoreFlower(String id, String snapshot) {
    if (snapshot == null || snapshot.isBlank()) {
      deleteFlowerState(id);
      return;
    }
    FlowerResponse data = readValue(snapshot, FlowerResponse.class);
    Flower entity = new Flower();
    entity.setId(data.getId());
    entity.setName(data.getName());
    entity.setCategoryId(data.getCategoryId());
    entity.setPrice(data.getPrice() == null ? BigDecimal.ZERO : data.getPrice());
    entity.setDescription(data.getDescription());
    entity.setMeaning(data.getMeaning());
    entity.setFeatured(Boolean.TRUE.equals(data.getFeatured()));
    entity.setSort(data.getSort() == null ? 0 : data.getSort());
    entity.setCreatedAt(parseDate(data.getCreatedAt()));
    if (flowerMapper.selectById(id) == null) {
      flowerMapper.insert(entity);
    } else {
      flowerMapper.updateById(entity);
    }
    deleteFlowerStateChildren(id);
    insertFlowerImages(id, data.getImages());
    insertFlowerMaterials(id, data.getMaterials());
    insertFlowerTags(id, data.getTags());
  }

  private void restoreSiteConfig(String snapshot) {
    SiteConfigUpdateResponse data = readValue(snapshot, SiteConfigUpdateResponse.class);
    SiteConfigResponse siteConfig = data.getSiteConfig();
    ShopInfoResponse shopInfo = data.getShopInfo();
    BrandStoryResponse brandStory = data.getBrandStory();

    SiteConfig config = new SiteConfig();
    config.setId(SINGLETON_ID);
    config.setBrandName(siteConfig.getBrandName());
    config.setHeroEyebrow(siteConfig.getHeroEyebrow());
    config.setHeroTitle(siteConfig.getHeroTitle());
    config.setHeroDescription(siteConfig.getHeroDescription());
    config.setHeroImage(siteConfig.getHeroImage());
    config.setPrimaryCtaText(siteConfig.getPrimaryCtaText());
    config.setSecondaryCtaText(siteConfig.getSecondaryCtaText());
    config.setContactIntro(siteConfig.getContactIntro());
    config.setBusinessHoursText(siteConfig.getBusinessHoursText());
    config.setFooterDescription(siteConfig.getFooterDescription());
    if (siteConfigMapper.selectById(SINGLETON_ID) == null) {
      siteConfigMapper.insert(config);
    } else {
      siteConfigMapper.updateById(config);
    }

    siteConfigStatMapper.delete(null);
    if (siteConfig.getStats() != null) {
      for (int i = 0; i < siteConfig.getStats().size(); i++) {
        SiteConfigStat stat = new SiteConfigStat();
        stat.setValue(siteConfig.getStats().get(i).getValue());
        stat.setLabel(siteConfig.getStats().get(i).getLabel());
        stat.setSort(i);
        siteConfigStatMapper.insert(stat);
      }
    }

    ShopInfo shop = new ShopInfo();
    shop.setId(SINGLETON_ID);
    shop.setName(shopInfo.getName());
    shop.setPhone(shopInfo.getPhone());
    shop.setWechat(shopInfo.getWechat());
    shop.setAddress(shopInfo.getAddress());
    shop.setLatitude(shopInfo.getLatitude());
    shop.setLongitude(shopInfo.getLongitude());
    if (shopInfoMapper.selectById(SINGLETON_ID) == null) {
      shopInfoMapper.insert(shop);
    } else {
      shopInfoMapper.updateById(shop);
    }

    BrandStory story = new BrandStory();
    story.setId(SINGLETON_ID);
    story.setTitle(brandStory.getTitle());
    story.setSubtitle(brandStory.getSubtitle());
    story.setContent(brandStory.getContent());
    if (brandStoryMapper.selectById(SINGLETON_ID) == null) {
      brandStoryMapper.insert(story);
    } else {
      brandStoryMapper.updateById(story);
    }

    brandStoryImageMapper.delete(null);
    if (brandStory.getImages() != null) {
      for (int i = 0; i < brandStory.getImages().size(); i++) {
        BrandStoryImage image = new BrandStoryImage();
        image.setImageUrl(brandStory.getImages().get(i));
        image.setSort(i);
        brandStoryImageMapper.insert(image);
      }
    }
  }

  private void restoreAboutPage(String snapshot) {
    AboutPageResponse data = readValue(snapshot, AboutPageResponse.class);
    AboutPage page = new AboutPage();
    page.setId(SINGLETON_ID);
    page.setHeroImage(data.getHeroImage());
    page.setHeroEyebrow(data.getHeroEyebrow());
    page.setHeroTitle(data.getHeroTitle());
    page.setHeroSubtitle(data.getHeroSubtitle());
    page.setStoryTitle(data.getStoryTitle());
    page.setStoryContent(data.getStoryContent());
    if (aboutPageMapper.selectById(SINGLETON_ID) == null) {
      aboutPageMapper.insert(page);
    } else {
      aboutPageMapper.updateById(page);
    }
  }

  private void restoreTimeline(String id, String snapshot) {
    if (snapshot == null || snapshot.isBlank()) {
      aboutTimelineEntryMapper.deleteById(id);
      return;
    }
    AboutTimelineEntryResponse data = readValue(snapshot, AboutTimelineEntryResponse.class);
    AboutTimelineEntry entity = new AboutTimelineEntry();
    entity.setId(data.getId());
    entity.setYearLabel(data.getYearLabel());
    entity.setContent(data.getContent());
    entity.setSort(data.getSort());
    if (aboutTimelineEntryMapper.selectById(id) == null) {
      aboutTimelineEntryMapper.insert(entity);
    } else {
      aboutTimelineEntryMapper.updateById(entity);
    }
  }

  private void restoreTeamMember(String id, String snapshot) {
    if (snapshot == null || snapshot.isBlank()) {
      teamMemberMapper.deleteById(id);
      return;
    }
    TeamMember entity = readValue(snapshot, TeamMember.class);
    if (teamMemberMapper.selectById(id) == null) {
      teamMemberMapper.insert(entity);
    } else {
      teamMemberMapper.updateById(entity);
    }
  }

  private void restoreContact(String id, String snapshot) {
    Contact entity = readValue(snapshot, Contact.class);
    if (contactMapper.selectById(id) == null) {
      contactMapper.insert(entity);
    } else {
      contactMapper.updateById(entity);
    }
  }

  private void restoreAiSettings(String snapshot) {
    AiSettings entity = readValue(snapshot, AiSettings.class);
    entity.setId(SINGLETON_ID);
    if (aiSettingsMapper.selectById(SINGLETON_ID) == null) {
      aiSettingsMapper.insert(entity);
    } else {
      aiSettingsMapper.updateById(entity);
    }
  }

  private void deleteFlowerState(String id) {
    deleteFlowerStateChildren(id);
    flowerMapper.deleteById(id);
  }

  private void deleteFlowerStateChildren(String flowerId) {
    flowerImageMapper.delete(new LambdaQueryWrapper<FlowerImage>().eq(FlowerImage::getFlowerId, flowerId));
    flowerMaterialMapper.delete(new LambdaQueryWrapper<FlowerMaterial>().eq(FlowerMaterial::getFlowerId, flowerId));
    flowerTagMapper.delete(new LambdaQueryWrapper<FlowerTag>().eq(FlowerTag::getFlowerId, flowerId));
  }

  private void insertFlowerImages(String flowerId, List<String> images) {
    if (images == null) {
      return;
    }
    for (int i = 0; i < images.size(); i++) {
      FlowerImage image = new FlowerImage();
      image.setFlowerId(flowerId);
      image.setImageUrl(images.get(i));
      image.setSort(i);
      flowerImageMapper.insert(image);
    }
  }

  private void insertFlowerMaterials(String flowerId, List<String> materials) {
    if (materials == null) {
      return;
    }
    for (int i = 0; i < materials.size(); i++) {
      FlowerMaterial item = new FlowerMaterial();
      item.setFlowerId(flowerId);
      item.setMaterial(materials.get(i));
      item.setSort(i);
      flowerMaterialMapper.insert(item);
    }
  }

  private void insertFlowerTags(String flowerId, List<String> tags) {
    if (tags == null) {
      return;
    }
    for (int i = 0; i < tags.size(); i++) {
      FlowerTag item = new FlowerTag();
      item.setFlowerId(flowerId);
      item.setTag(tags.get(i));
      item.setSort(i);
      flowerTagMapper.insert(item);
    }
  }

  private LocalDateTime parseDate(String value) {
    if (value == null || value.isBlank()) {
      return LocalDateTime.now();
    }
    try {
      return OffsetDateTime.parse(value).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
    } catch (DateTimeParseException ignored) {
      try {
        return LocalDateTime.parse(value);
      } catch (DateTimeParseException nestedIgnored) {
        return LocalDateTime.now();
      }
    }
  }

  private <T> T readValue(String raw, Class<T> type) {
    try {
      return objectMapper.readValue(raw, type);
    } catch (Exception error) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "日志快照格式无效，无法恢复");
    }
  }

  @SuppressWarnings("unused")
  private <T> T readValue(String raw, TypeReference<T> typeReference) {
    try {
      return objectMapper.readValue(raw, typeReference);
    } catch (Exception error) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "日志快照格式无效，无法恢复");
    }
  }
}
