package com.floralwhisper.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.util.Collections;
import java.math.BigDecimal;
import java.util.ArrayList;
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
  private List<@Valid SiteStatResponse> stats;
  @Size(max = 240, message = "联系简介不能超过 240 个字符")
  private String contactIntro;
  @Size(max = 120, message = "营业时间文案不能超过 120 个字符")
  private String businessHoursText;
  @Size(max = 240, message = "页脚简介不能超过 240 个字符")
  private String footerDescription;
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

  public List<SiteStatResponse> getStats() {
    return stats == null ? null : Collections.unmodifiableList(stats);
  }

  public List<String> getStoryImages() {
    return storyImages == null ? null : Collections.unmodifiableList(storyImages);
  }
}
