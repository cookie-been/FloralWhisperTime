package com.floralwhisper.dto;

import java.time.LocalDateTime;
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
  private String licenseCustomerName;
  private String licenseCode;
  private String licenseType;
  private LocalDateTime licenseExpiresAt;
  private Integer licenseWarningDays;
  private String licenseNotes;
}
