package com.floralwhisper.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SiteConfigUpdateResponse {
  private SiteConfigResponse siteConfig;
  private ShopInfoResponse shopInfo;
  private BrandStoryResponse brandStory;
}
