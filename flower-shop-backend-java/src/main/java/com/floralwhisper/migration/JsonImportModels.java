package com.floralwhisper.migration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

public final class JsonImportModels {
  private JsonImportModels() {}

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class LegacyDb {
    private List<CategoryRecord> categories = new ArrayList<>();
    private List<FlowerRecord> flowers = new ArrayList<>();
    private ShopInfoRecord shopInfo;
    private BrandStoryRecord brandStory;
    private List<TeamMemberRecord> teamMembers = new ArrayList<>();
    private List<ContactRecord> contacts = new ArrayList<>();
    private SiteConfigRecord siteConfig;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class CategoryRecord {
    private String id;
    private String name;
    private String icon;
    private String description;
    private Integer sort;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class FlowerRecord {
    private String id;
    private String code;
    private String name;
    private String categoryId;
    private List<String> images = new ArrayList<>();
    private BigDecimal price;
    private String description;
    private List<String> materials = new ArrayList<>();
    private String meaning;
    private List<String> tags = new ArrayList<>();
    private Boolean featured;
    private Integer sort;
    private String createdAt;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ShopInfoRecord {
    private String name;
    private String phone;
    private String wechat;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private HoursRecord hours;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class HoursRecord {
    private TimeRangeRecord monday;
    private TimeRangeRecord tuesday;
    private TimeRangeRecord wednesday;
    private TimeRangeRecord thursday;
    private TimeRangeRecord friday;
    private TimeRangeRecord saturday;
    private TimeRangeRecord sunday;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class TimeRangeRecord {
    private String open;
    private String close;
    private Boolean off;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class BrandStoryRecord {
    private String title;
    private String subtitle;
    private String content;
    private List<String> images = new ArrayList<>();
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class TeamMemberRecord {
    private String id;
    private String name;
    private String title;
    private String avatar;
    private String bio;
    private Integer sort;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class ContactRecord {
    private String id;
    private String name;
    private String phone;
    private String message;
    private String createdAt;
  }

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class SiteConfigRecord {
    private String brandName;
    private String heroEyebrow;
    private String heroTitle;
    private String heroDescription;
    private String heroImage;
    private String primaryCtaText;
    private String secondaryCtaText;
    private String contactIntro;
    private String businessHoursText;
    private String footerDescription;
  }
}
