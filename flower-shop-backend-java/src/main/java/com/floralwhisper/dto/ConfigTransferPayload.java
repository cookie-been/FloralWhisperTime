package com.floralwhisper.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.floralwhisper.entity.TeamMember;
import java.util.List;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfigTransferPayload {
  private String version;
  private String generatedAt;
  private SiteConfigResponse siteConfig;
  private ShopInfoResponse shopInfo;
  private BrandStoryResponse brandStory;
  private AboutPageResponse aboutPage;
  private List<AboutTimelineEntryResponse> timeline;
  private List<TeamMember> team;
  private ConfigTransferAiSettings aiSettings;
}
