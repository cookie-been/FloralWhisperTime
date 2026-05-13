package com.floralwhisper.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class SiteConfigUpdateRequest {
  private String brandName;
  private String heroEyebrow;
  private String heroTitle;
  private String heroDescription;
  private String heroImage;
  private String primaryCtaText;
  private String secondaryCtaText;
  private List<SiteStatResponse> stats = new ArrayList<>();
  private String contactIntro;
  private String businessHoursText;
  private String footerDescription;
  private String phone;
  private String wechat;
  private String address;
  private BigDecimal latitude;
  private BigDecimal longitude;
  private String storyTitle;
  private String storySubtitle;
  private String storyContent;
  private List<String> storyImages = new ArrayList<>();
}

