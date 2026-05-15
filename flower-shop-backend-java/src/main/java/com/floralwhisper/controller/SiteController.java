package com.floralwhisper.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.ContactRequest;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.protection.HeavyOperationGuard;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import com.floralwhisper.storage.FileStorageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class SiteController {
  private final SiteService siteService;
  private final ContactService contactService;
  private final FileStorageService fileStorageService;
  private final HeavyOperationGuard heavyOperationGuard;

  public SiteController(
      SiteService siteService,
      ContactService contactService,
      FileStorageService fileStorageService,
      HeavyOperationGuard heavyOperationGuard) {
    this.siteService = siteService;
    this.contactService = contactService;
    this.fileStorageService = fileStorageService;
    this.heavyOperationGuard = heavyOperationGuard;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("ok", true, "service", "flower-shop-backend-java");
  }

  @GetMapping("/categories")
  public List<Category> categories() {
    return siteService.getCategories();
  }

  @GetMapping("/site-config")
  public SiteConfigResponse siteConfig() {
    SiteConfigResponse source = siteService.getSiteConfig();
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName(source.getBrandName());
    response.setHeroEyebrow(source.getHeroEyebrow());
    response.setHeroTitle(source.getHeroTitle());
    response.setHeroDescription(source.getHeroDescription());
    response.setHeroImage(source.getHeroImage());
    response.setPrimaryCtaText(source.getPrimaryCtaText());
    response.setSecondaryCtaText(source.getSecondaryCtaText());
    response.setContactIntro(source.getContactIntro());
    response.setBusinessHoursText(source.getBusinessHoursText());
    response.setFooterDescription(source.getFooterDescription());
    response.setBrandLogo(source.getBrandLogo());
    response.setHeroSlides(source.getHeroSlides());
    response.setAdminLoginSlides(source.getAdminLoginSlides());
    response.setContactImages(source.getContactImages());
    response.setAdminBrandTitle(source.getAdminBrandTitle());
    response.setAdminBrandSubtitle(source.getAdminBrandSubtitle());
    response.setAdminBrandDescription(source.getAdminBrandDescription());
    response.setHomeStorySectionTitle(source.getHomeStorySectionTitle());
    response.setHomeStorySectionIntro(source.getHomeStorySectionIntro());
    response.setHomeStoryPrimaryLabel(source.getHomeStoryPrimaryLabel());
    response.setHomeStoryPrimaryTitle(source.getHomeStoryPrimaryTitle());
    response.setHomeStoryPrimaryDescription(source.getHomeStoryPrimaryDescription());
    response.setHomeStoryServiceLabel(source.getHomeStoryServiceLabel());
    response.setHomeStoryServiceDescription(source.getHomeStoryServiceDescription());
    response.setHomeStoryExperienceLabel(source.getHomeStoryExperienceLabel());
    response.setHomeStoryExperienceDescription(source.getHomeStoryExperienceDescription());
    response.setHomeStoryStoreLabel(source.getHomeStoryStoreLabel());
    response.setHomeStoryDetailLinkText(source.getHomeStoryDetailLinkText());
    response.setHomeFeaturedSectionEyebrow(source.getHomeFeaturedSectionEyebrow());
    response.setHomeFeaturedSectionTitle(source.getHomeFeaturedSectionTitle());
    response.setHomeFeaturedSectionIntro(source.getHomeFeaturedSectionIntro());
    response.setHomeFeaturedSectionLinkText(source.getHomeFeaturedSectionLinkText());
    response.setHomeServiceSectionEyebrow(source.getHomeServiceSectionEyebrow());
    response.setHomeServiceSectionTitle(source.getHomeServiceSectionTitle());
    response.setHomeServiceSectionIntro(source.getHomeServiceSectionIntro());
    response.setHomeServiceSectionLinkText(source.getHomeServiceSectionLinkText());
    response.setAboutStorySectionEyebrow(source.getAboutStorySectionEyebrow());
    response.setAboutTimelineSectionEyebrow(source.getAboutTimelineSectionEyebrow());
    response.setAboutTimelineSectionTitle(source.getAboutTimelineSectionTitle());
    response.setAboutTeamSectionEyebrow(source.getAboutTeamSectionEyebrow());
    response.setAboutTeamSectionTitle(source.getAboutTeamSectionTitle());
    response.setAboutTeamSectionIntro(source.getAboutTeamSectionIntro());
    response.setGalleryPageEyebrow(source.getGalleryPageEyebrow());
    response.setGalleryPageTitle(source.getGalleryPageTitle());
    response.setGalleryPageIntro(source.getGalleryPageIntro());
    response.setGallerySearchPlaceholder(source.getGallerySearchPlaceholder());
    response.setGalleryEmptyText(source.getGalleryEmptyText());
    response.setGalleryLoadErrorText(source.getGalleryLoadErrorText());
    response.setContactPageTitle(source.getContactPageTitle());
    response.setContactPageSubmitText(source.getContactPageSubmitText());
    response.setContactSubmitSuccessText(source.getContactSubmitSuccessText());
    response.setConsultButtonText(source.getConsultButtonText());
    response.setAdminDashboardEyebrow(source.getAdminDashboardEyebrow());
    response.setAdminDashboardTitle(source.getAdminDashboardTitle());
    response.setAdminDashboardDescription(source.getAdminDashboardDescription());
    response.setAdminFlowersEyebrow(source.getAdminFlowersEyebrow());
    response.setAdminFlowersTitle(source.getAdminFlowersTitle());
    response.setAdminFlowersDescription(source.getAdminFlowersDescription());
    response.setAdminSettingsEyebrow(source.getAdminSettingsEyebrow());
    response.setAdminSettingsTitle(source.getAdminSettingsTitle());
    response.setAdminSettingsDescription(source.getAdminSettingsDescription());
    response.setAdminAiEyebrow(source.getAdminAiEyebrow());
    response.setAdminAiTitle(source.getAdminAiTitle());
    response.setAdminAiDescription(source.getAdminAiDescription());
    response.setAdminContactsEyebrow(source.getAdminContactsEyebrow());
    response.setAdminContactsTitle(source.getAdminContactsTitle());
    response.setAdminContactsDescription(source.getAdminContactsDescription());
    response.setAdminSystemEyebrow(source.getAdminSystemEyebrow());
    response.setAdminSystemTitle(source.getAdminSystemTitle());
    response.setAdminSystemDescription(source.getAdminSystemDescription());
    response.setAdminOperationLogsEyebrow(source.getAdminOperationLogsEyebrow());
    response.setAdminOperationLogsTitle(source.getAdminOperationLogsTitle());
    response.setAdminOperationLogsDescription(source.getAdminOperationLogsDescription());
    return response;
  }

  @PutMapping("/site-config")
  public SiteConfigUpdateResponse updateSiteConfig(@Valid @RequestBody SiteConfigUpdateRequest request) {
    return siteService.updateSiteConfig(request);
  }

  @GetMapping("/shop-info")
  public ShopInfoResponse shopInfo() {
    return siteService.getShopInfo();
  }

  @GetMapping("/brand-story")
  public BrandStoryResponse brandStory() {
    return siteService.getBrandStory();
  }

  @GetMapping("/about-page")
  public AboutPageResponse aboutPage() {
    return siteService.getAboutPage();
  }

  @GetMapping("/about-timeline")
  public List<AboutTimelineEntryResponse> aboutTimeline() {
    return siteService.getAboutTimeline();
  }

  @GetMapping("/team")
  public List<TeamMember> team() {
    return siteService.getAdminTeamMembers();
  }

  @PostMapping("/contact")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Boolean> contact(@Valid @RequestBody ContactRequest request) {
    return contactService.create(request);
  }

  @PostMapping("/uploads")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
    try (HeavyOperationGuard.Permit ignored = heavyOperationGuard.acquireUploadPermit()) {
      return fileStorageService.store(file);
    }
  }
}
