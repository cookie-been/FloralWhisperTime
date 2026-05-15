package com.floralwhisper.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import lombok.Data;

@Data
public class SiteConfigUpdateRequest {
  @Size(max = 60, message = "品牌名称不能超过 60 个字符")
  private String brandName;
  @Size(max = 80, message = "首屏小标语不能超过 80 个字符")
  private String heroEyebrow;
  @Size(max = 120, message = "首页主标题不能超过 120 个字符")
  private String heroTitle;
  @Size(max = 500, message = "首页简介不能超过 500 个字符")
  private String heroDescription;
  @Size(max = 500, message = "首屏背景图地址不能超过 500 个字符")
  private String heroImage;
  @Size(max = 40, message = "主按钮文字不能超过 40 个字符")
  private String primaryCtaText;
  @Size(max = 40, message = "副按钮文字不能超过 40 个字符")
  private String secondaryCtaText;
  @Size(max = 240, message = "联系简介不能超过 240 个字符")
  private String contactIntro;
  @Size(max = 120, message = "营业时间文案不能超过 120 个字符")
  private String businessHoursText;
  @Size(max = 240, message = "页脚简介不能超过 240 个字符")
  private String footerDescription;
  @Size(max = 500, message = "Logo 地址不能超过 500 个字符")
  private String brandLogo;
  private List<String> heroSlides;
  private List<String> adminLoginSlides;
  private List<String> contactImages;
  @Size(max = 120, message = "后台品牌标题不能超过 120 个字符")
  private String adminBrandTitle;
  @Size(max = 120, message = "后台品牌副标题不能超过 120 个字符")
  private String adminBrandSubtitle;
  @Size(max = 240, message = "后台品牌简介不能超过 240 个字符")
  private String adminBrandDescription;
  @Size(max = 120, message = "首页品牌故事标题不能超过 120 个字符")
  private String homeStorySectionTitle;
  @Size(max = 500, message = "首页品牌故事简介不能超过 500 个字符")
  private String homeStorySectionIntro;
  @Size(max = 60, message = "首页品牌卡片标签不能超过 60 个字符")
  private String homeStoryPrimaryLabel;
  @Size(max = 120, message = "首页品牌卡片标题不能超过 120 个字符")
  private String homeStoryPrimaryTitle;
  @Size(max = 300, message = "首页品牌卡片说明不能超过 300 个字符")
  private String homeStoryPrimaryDescription;
  @Size(max = 60, message = "首页服务方式标签不能超过 60 个字符")
  private String homeStoryServiceLabel;
  @Size(max = 240, message = "首页服务方式说明不能超过 240 个字符")
  private String homeStoryServiceDescription;
  @Size(max = 60, message = "首页到店体验标签不能超过 60 个字符")
  private String homeStoryExperienceLabel;
  @Size(max = 240, message = "首页到店体验说明不能超过 240 个字符")
  private String homeStoryExperienceDescription;
  @Size(max = 60, message = "首页门店信息标签不能超过 60 个字符")
  private String homeStoryStoreLabel;
  @Size(max = 40, message = "首页品牌故事按钮文字不能超过 40 个字符")
  private String homeStoryDetailLinkText;
  @Size(max = 60, message = "首页精选区眉题不能超过 60 个字符")
  private String homeFeaturedSectionEyebrow;
  @Size(max = 120, message = "首页精选区标题不能超过 120 个字符")
  private String homeFeaturedSectionTitle;
  @Size(max = 300, message = "首页精选区导语不能超过 300 个字符")
  private String homeFeaturedSectionIntro;
  @Size(max = 40, message = "首页精选区按钮文字不能超过 40 个字符")
  private String homeFeaturedSectionLinkText;
  @Size(max = 60, message = "首页服务场景眉题不能超过 60 个字符")
  private String homeServiceSectionEyebrow;
  @Size(max = 120, message = "首页服务场景标题不能超过 120 个字符")
  private String homeServiceSectionTitle;
  @Size(max = 300, message = "首页服务场景导语不能超过 300 个字符")
  private String homeServiceSectionIntro;
  @Size(max = 40, message = "首页服务场景按钮文字不能超过 40 个字符")
  private String homeServiceSectionLinkText;
  @Size(max = 60, message = "关于页故事眉题不能超过 60 个字符")
  private String aboutStorySectionEyebrow;
  @Size(max = 60, message = "关于页时间轴眉题不能超过 60 个字符")
  private String aboutTimelineSectionEyebrow;
  @Size(max = 120, message = "关于页时间轴标题不能超过 120 个字符")
  private String aboutTimelineSectionTitle;
  @Size(max = 60, message = "关于页团队眉题不能超过 60 个字符")
  private String aboutTeamSectionEyebrow;
  @Size(max = 120, message = "关于页团队标题不能超过 120 个字符")
  private String aboutTeamSectionTitle;
  @Size(max = 300, message = "关于页团队简介不能超过 300 个字符")
  private String aboutTeamSectionIntro;
  @Size(max = 60, message = "画廊页眉题不能超过 60 个字符")
  private String galleryPageEyebrow;
  @Size(max = 120, message = "画廊页标题不能超过 120 个字符")
  private String galleryPageTitle;
  @Size(max = 300, message = "画廊页简介不能超过 300 个字符")
  private String galleryPageIntro;
  @Size(max = 80, message = "画廊搜索占位文案不能超过 80 个字符")
  private String gallerySearchPlaceholder;
  @Size(max = 120, message = "画廊空状态文案不能超过 120 个字符")
  private String galleryEmptyText;
  @Size(max = 120, message = "画廊加载失败文案不能超过 120 个字符")
  private String galleryLoadErrorText;
  @Size(max = 120, message = "联系页标题不能超过 120 个字符")
  private String contactPageTitle;
  @Size(max = 40, message = "联系页提交按钮文字不能超过 40 个字符")
  private String contactPageSubmitText;
  @Size(max = 80, message = "联系页提交成功文案不能超过 80 个字符")
  private String contactSubmitSuccessText;
  @Size(max = 40, message = "咨询按钮文字不能超过 40 个字符")
  private String consultButtonText;
  @Size(max = 60, message = "后台总览眉题不能超过 60 个字符")
  private String adminDashboardEyebrow;
  @Size(max = 120, message = "后台总览标题不能超过 120 个字符")
  private String adminDashboardTitle;
  @Size(max = 240, message = "后台总览说明不能超过 240 个字符")
  private String adminDashboardDescription;
  @Size(max = 60, message = "后台作品管理眉题不能超过 60 个字符")
  private String adminFlowersEyebrow;
  @Size(max = 120, message = "后台作品管理标题不能超过 120 个字符")
  private String adminFlowersTitle;
  @Size(max = 240, message = "后台作品管理说明不能超过 240 个字符")
  private String adminFlowersDescription;
  @Size(max = 60, message = "后台站点配置眉题不能超过 60 个字符")
  private String adminSettingsEyebrow;
  @Size(max = 120, message = "后台站点配置标题不能超过 120 个字符")
  private String adminSettingsTitle;
  @Size(max = 240, message = "后台站点配置说明不能超过 240 个字符")
  private String adminSettingsDescription;
  @Size(max = 60, message = "后台 AI 配置眉题不能超过 60 个字符")
  private String adminAiEyebrow;
  @Size(max = 120, message = "后台 AI 配置标题不能超过 120 个字符")
  private String adminAiTitle;
  @Size(max = 240, message = "后台 AI 配置说明不能超过 240 个字符")
  private String adminAiDescription;
  @Size(max = 60, message = "后台用户留言眉题不能超过 60 个字符")
  private String adminContactsEyebrow;
  @Size(max = 120, message = "后台用户留言标题不能超过 120 个字符")
  private String adminContactsTitle;
  @Size(max = 240, message = "后台用户留言说明不能超过 240 个字符")
  private String adminContactsDescription;
  @Size(max = 60, message = "后台运维中心眉题不能超过 60 个字符")
  private String adminSystemEyebrow;
  @Size(max = 120, message = "后台运维中心标题不能超过 120 个字符")
  private String adminSystemTitle;
  @Size(max = 240, message = "后台运维中心说明不能超过 240 个字符")
  private String adminSystemDescription;
  @Size(max = 60, message = "后台操作日志眉题不能超过 60 个字符")
  private String adminOperationLogsEyebrow;
  @Size(max = 120, message = "后台操作日志标题不能超过 120 个字符")
  private String adminOperationLogsTitle;
  @Size(max = 240, message = "后台操作日志说明不能超过 240 个字符")
  private String adminOperationLogsDescription;
  @Size(max = 120, message = "客户名称不能超过 120 个字符")
  private String licenseCustomerName;
  @Size(max = 120, message = "授权编号不能超过 120 个字符")
  private String licenseCode;
  @Size(max = 60, message = "授权类型不能超过 60 个字符")
  private String licenseType;
  private LocalDateTime licenseExpiresAt;
  @jakarta.validation.constraints.Min(value = 1, message = "预警天数至少为 1 天")
  @jakarta.validation.constraints.Max(value = 365, message = "预警天数不能超过 365 天")
  private Integer licenseWarningDays;
  @Size(max = 500, message = "授权备注不能超过 500 个字符")
  private String licenseNotes;
  @Size(max = 40, message = "电话不能超过 40 个字符")
  private String phone;
  @Size(max = 60, message = "微信不能超过 60 个字符")
  private String wechat;
  @Size(max = 160, message = "地址不能超过 160 个字符")
  private String address;
  @DecimalMin(value = "-90.0", message = "纬度超出允许范围")
  @DecimalMax(value = "90.0", message = "纬度超出允许范围")
  private BigDecimal latitude;
  @DecimalMin(value = "-180.0", message = "经度超出允许范围")
  @DecimalMax(value = "180.0", message = "经度超出允许范围")
  private BigDecimal longitude;
  @Size(max = 120, message = "故事标题不能超过 120 个字符")
  private String storyTitle;
  @Size(max = 160, message = "故事副标题不能超过 160 个字符")
  private String storySubtitle;
  @Size(max = 3000, message = "故事正文不能超过 3000 个字符")
  private String storyContent;
  private List<String> storyImages;

  public List<String> getStoryImages() {
    return storyImages == null ? null : Collections.unmodifiableList(storyImages);
  }

  public List<String> getHeroSlides() {
    return heroSlides == null ? null : Collections.unmodifiableList(heroSlides);
  }

  public List<String> getAdminLoginSlides() {
    return adminLoginSlides == null ? null : Collections.unmodifiableList(adminLoginSlides);
  }

  public List<String> getContactImages() {
    return contactImages == null ? null : Collections.unmodifiableList(contactImages);
  }
}
