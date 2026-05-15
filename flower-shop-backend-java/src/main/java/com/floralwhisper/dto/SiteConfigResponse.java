package com.floralwhisper.dto;

import lombok.Data;

@Data
public class SiteConfigResponse {
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
