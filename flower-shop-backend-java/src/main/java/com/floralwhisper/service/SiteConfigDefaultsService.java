package com.floralwhisper.service;

import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import org.springframework.stereotype.Service;

@Service
public class SiteConfigDefaultsService {

  SiteConfig applyMissingDefaults(SiteConfig current) {
    boolean dirty = false;
    dirty |= setIfNull(current::getBrandLogo, current::setBrandLogo, "");
    dirty |= setIfNull(current::getAdminBrandTitle, current::setAdminBrandTitle, "");
    dirty |= setIfNull(current::getAdminBrandSubtitle, current::setAdminBrandSubtitle, "");
    dirty |= setIfNull(current::getAdminBrandDescription, current::setAdminBrandDescription, "");
    dirty |= setIfNull(current::getHomeStorySectionTitle, current::setHomeStorySectionTitle, "品牌故事");
    dirty |= setIfNull(current::getHomeStorySectionIntro, current::setHomeStorySectionIntro, "把品牌气质、服务方式和到店感受压缩进首页一屏，让访问者在浏览作品之外，也能快速理解这家店的表达方式。");
    dirty |= setIfNull(current::getHomeStoryPrimaryLabel, current::setHomeStoryPrimaryLabel, "品牌气质");
    dirty |= setIfNull(current::getHomeStoryPrimaryTitle, current::setHomeStoryPrimaryTitle, "自然、克制、适合长期被记住");
    dirty |= setIfNull(current::getHomeStoryPrimaryDescription, current::setHomeStoryPrimaryDescription, "以稳定的花材审美、礼赠场景理解和空间氛围组织，呈现更适合现代城市生活的花艺表达。");
    dirty |= setIfNull(current::getHomeStoryServiceLabel, current::setHomeStoryServiceLabel, "服务方式");
    dirty |= setIfNull(current::getHomeStoryServiceDescription, current::setHomeStoryServiceDescription, "门店零售、场景花礼、婚礼与空间陈设同步提供。");
    dirty |= setIfNull(current::getHomeStoryExperienceLabel, current::setHomeStoryExperienceLabel, "到店体验");
    dirty |= setIfNull(current::getHomeStoryExperienceDescription, current::setHomeStoryExperienceDescription, "更强调现场沟通、花材观察和场景适配，而不是模板式套装推荐。");
    dirty |= setIfNull(current::getHomeStoryStoreLabel, current::setHomeStoryStoreLabel, "门店信息");
    dirty |= setIfNull(current::getHomeStoryDetailLinkText, current::setHomeStoryDetailLinkText, "查看完整介绍");
    dirty |= setIfNull(current::getHomeFeaturedSectionEyebrow, current::setHomeFeaturedSectionEyebrow, "精选作品");
    dirty |= setIfNull(current::getHomeFeaturedSectionTitle, current::setHomeFeaturedSectionTitle, "精选作品");
    dirty |= setIfNull(current::getHomeFeaturedSectionIntro, current::setHomeFeaturedSectionIntro, "首页保留一组更完整的精选作品视图，覆盖礼赠、婚礼、空间陈设等主要场景，方便快速判断整体风格。");
    dirty |= setIfNull(current::getHomeFeaturedSectionLinkText, current::setHomeFeaturedSectionLinkText, "查看全部");
    dirty |= setIfNull(current::getHomeServiceSectionEyebrow, current::setHomeServiceSectionEyebrow, "服务场景");
    dirty |= setIfNull(current::getHomeServiceSectionTitle, current::setHomeServiceSectionTitle, "服务场景");
    dirty |= setIfNull(current::getHomeServiceSectionIntro, current::setHomeServiceSectionIntro, "用更明确的分类入口，把婚礼、日常赠礼、开业和空间定制等常用浏览路径提前放到首页，减少访客进入画廊后的筛选成本。");
    dirty |= setIfNull(current::getHomeServiceSectionLinkText, current::setHomeServiceSectionLinkText, "浏览全部分类");
    dirty |= setIfNull(current::getAboutStorySectionEyebrow, current::setAboutStorySectionEyebrow, "品牌故事");
    dirty |= setIfNull(current::getAboutTimelineSectionEyebrow, current::setAboutTimelineSectionEyebrow, "发展历程");
    dirty |= setIfNull(current::getAboutTimelineSectionTitle, current::setAboutTimelineSectionTitle, "发展历程");
    dirty |= setIfNull(current::getAboutTeamSectionEyebrow, current::setAboutTeamSectionEyebrow, "团队成员");
    dirty |= setIfNull(current::getAboutTeamSectionTitle, current::setAboutTeamSectionTitle, "花艺师团队");
    dirty |= setIfNull(current::getAboutTeamSectionIntro, current::setAboutTeamSectionIntro, "团队成员、职务与简介均由后台统一维护，用于表达品牌方法和实际服务能力。");
    dirty |= setIfNull(current::getGalleryPageEyebrow, current::setGalleryPageEyebrow, "作品浏览");
    dirty |= setIfNull(current::getGalleryPageTitle, current::setGalleryPageTitle, "作品画廊");
    dirty |= setIfNull(current::getGalleryPageIntro, current::setGalleryPageIntro, "按分类、关键词和排序浏览花语时光的花束与空间花艺作品，直接查看更完整的作品面貌与氛围。");
    dirty |= setIfNull(current::getGallerySearchPlaceholder, current::setGallerySearchPlaceholder, "搜索花束、花材或标签");
    dirty |= setIfNull(current::getGalleryEmptyText, current::setGalleryEmptyText, "没有找到匹配的花束作品");
    dirty |= setIfNull(current::getGalleryLoadErrorText, current::setGalleryLoadErrorText, "作品列表加载失败，请稍后刷新重试");
    dirty |= setIfNull(current::getContactPageTitle, current::setContactPageTitle, "联系我们");
    dirty |= setIfNull(current::getContactPageSubmitText, current::setContactPageSubmitText, "提交留言");
    dirty |= setIfNull(current::getContactSubmitSuccessText, current::setContactSubmitSuccessText, "留言已提交，我们会尽快联系你");
    dirty |= setIfNull(current::getConsultButtonText, current::setConsultButtonText, "咨询花艺");
    dirty |= setIfNull(current::getAdminDashboardEyebrow, current::setAdminDashboardEyebrow, "后台概览");
    dirty |= setIfNull(current::getAdminDashboardTitle, current::setAdminDashboardTitle, "运营总览");
    dirty |= setIfNull(current::getAdminDashboardDescription, current::setAdminDashboardDescription, "先看网站状态，再进入作品与内容编辑。");
    dirty |= setIfNull(current::getAdminFlowersEyebrow, current::setAdminFlowersEyebrow, "作品目录");
    dirty |= setIfNull(current::getAdminFlowersTitle, current::setAdminFlowersTitle, "作品管理");
    dirty |= setIfNull(current::getAdminFlowersDescription, current::setAdminFlowersDescription, "筛选、整理与更新作品内容，保持前台展示一致。");
    dirty |= setIfNull(current::getAdminSettingsEyebrow, current::setAdminSettingsEyebrow, "动态配置");
    dirty |= setIfNull(current::getAdminSettingsTitle, current::setAdminSettingsTitle, "站点配置");
    dirty |= setIfNull(current::getAdminSettingsDescription, current::setAdminSettingsDescription, "统一维护站点首页、门店信息、品牌故事与关于我们内容。");
    dirty |= setIfNull(current::getAdminAiEyebrow, current::setAdminAiEyebrow, "AI 工作台");
    dirty |= setIfNull(current::getAdminAiTitle, current::setAdminAiTitle, "AI 生图配置");
    dirty |= setIfNull(current::getAdminAiDescription, current::setAdminAiDescription, "统一维护 AI 生图与作品信息建议能力所需的开关、密钥、模型和接口参数。");
    dirty |= setIfNull(current::getAdminContactsEyebrow, current::setAdminContactsEyebrow, "访客留言");
    dirty |= setIfNull(current::getAdminContactsTitle, current::setAdminContactsTitle, "用户留言");
    dirty |= setIfNull(current::getAdminContactsDescription, current::setAdminContactsDescription, "查看访客提交的预约、咨询与定制需求。");
    dirty |= setIfNull(current::getAdminSystemEyebrow, current::setAdminSystemEyebrow, "运维状态");
    dirty |= setIfNull(current::getAdminSystemTitle, current::setAdminSystemTitle, "运维中心");
    dirty |= setIfNull(current::getAdminSystemDescription, current::setAdminSystemDescription, "统一查看系统状态，并执行备份、巡检和配置迁移。");
    dirty |= setIfNull(current::getAdminOperationLogsEyebrow, current::setAdminOperationLogsEyebrow, "审计恢复");
    dirty |= setIfNull(current::getAdminOperationLogsTitle, current::setAdminOperationLogsTitle, "操作日志");
    dirty |= setIfNull(current::getAdminOperationLogsDescription, current::setAdminOperationLogsDescription, "记录后台写操作和登录行为，并支持按历史快照恢复误操作数据。");
    dirty |= setIfBlank(current::getHeroSlidesJson, current::setHeroSlidesJson, "[]");
    dirty |= setIfBlank(current::getAdminLoginSlidesJson, current::setAdminLoginSlidesJson, "[]");
    dirty |= setIfBlank(current::getContactImagesJson, current::setContactImagesJson, "[]");
    return dirty ? current : null;
  }

  SiteConfig createDefault(Long id, ShopInfo shopInfo) {
    SiteConfig created = new SiteConfig();
    created.setId(id);
    created.setBrandName(shopInfo != null && notBlank(shopInfo.getName()) ? shopInfo.getName() : "花语时光");
    created.setHeroEyebrow("");
    created.setHeroTitle(created.getBrandName());
    created.setHeroDescription("");
    created.setHeroImage("");
    created.setPrimaryCtaText("浏览作品");
    created.setSecondaryCtaText("联系门店");
    created.setContactIntro("");
    created.setBusinessHoursText("");
    created.setFooterDescription("");
    created.setBrandLogo("");
    created.setHeroSlidesJson("[]");
    created.setAdminLoginSlidesJson("[]");
    created.setContactImagesJson("[]");
    created.setAdminBrandTitle(created.getBrandName() + "后台");
    created.setAdminBrandSubtitle("Floral Whisper Time");
    created.setAdminBrandDescription("从作品、站点内容与 AI 能力三个层面维护品牌展示。");
    applyMissingDefaults(created);
    return created;
  }

  private boolean setIfNull(ValueSupplier getter, ValueConsumer setter, String value) {
    if (getter.get() != null) {
      return false;
    }
    setter.accept(value);
    return true;
  }

  private boolean setIfBlank(ValueSupplier getter, ValueConsumer setter, String value) {
    if (notBlank(getter.get())) {
      return false;
    }
    setter.accept(value);
    return true;
  }

  private boolean notBlank(String value) {
    return value != null && !value.trim().isEmpty();
  }

  @FunctionalInterface
  private interface ValueSupplier {
    String get();
  }

  @FunctionalInterface
  private interface ValueConsumer {
    void accept(String value);
  }
}
