package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.BusinessHoursResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.dto.SiteStatResponse;
import com.floralwhisper.dto.TimeRangeResponse;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteService {
  private static final long SINGLETON_ID = 1L;

  private final SiteConfigMapper siteConfigMapper;
  private final SiteConfigStatMapper siteConfigStatMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final ShopHourMapper shopHourMapper;
  private final BrandStoryMapper brandStoryMapper;
  private final BrandStoryImageMapper brandStoryImageMapper;

  public SiteService(
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper) {
    this.siteConfigMapper = siteConfigMapper;
    this.siteConfigStatMapper = siteConfigStatMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.brandStoryMapper = brandStoryMapper;
    this.brandStoryImageMapper = brandStoryImageMapper;
  }

  public SiteConfigResponse getSiteConfig() {
    SiteConfig config = siteConfigMapper.selectById(SINGLETON_ID);
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName(config.getBrandName());
    response.setHeroEyebrow(config.getHeroEyebrow());
    response.setHeroTitle(config.getHeroTitle());
    response.setHeroDescription(config.getHeroDescription());
    response.setHeroImage(config.getHeroImage());
    response.setPrimaryCtaText(config.getPrimaryCtaText());
    response.setSecondaryCtaText(config.getSecondaryCtaText());
    response.setContactIntro(config.getContactIntro());
    response.setBusinessHoursText(config.getBusinessHoursText());
    response.setFooterDescription(config.getFooterDescription());
    response.setStats(siteConfigStatMapper.selectList(new LambdaQueryWrapper<SiteConfigStat>().orderByAsc(SiteConfigStat::getSort))
        .stream().map(this::toStatResponse).toList());
    return response;
  }

  public ShopInfoResponse getShopInfo() {
    ShopInfo shopInfo = shopInfoMapper.selectById(SINGLETON_ID);
    ShopInfoResponse response = new ShopInfoResponse();
    response.setName(shopInfo.getName());
    response.setPhone(shopInfo.getPhone());
    response.setWechat(shopInfo.getWechat());
    response.setAddress(shopInfo.getAddress());
    response.setLatitude(shopInfo.getLatitude());
    response.setLongitude(shopInfo.getLongitude());
    response.setHours(getBusinessHours());
    return response;
  }

  public BrandStoryResponse getBrandStory() {
    BrandStory story = brandStoryMapper.selectById(SINGLETON_ID);
    BrandStoryResponse response = new BrandStoryResponse();
    response.setTitle(story.getTitle());
    response.setSubtitle(story.getSubtitle());
    response.setContent(story.getContent());
    response.setImages(brandStoryImageMapper.selectList(new LambdaQueryWrapper<BrandStoryImage>().orderByAsc(BrandStoryImage::getSort))
        .stream().map(BrandStoryImage::getImageUrl).toList());
    return response;
  }

  @Transactional
  public SiteConfigUpdateResponse updateSiteConfig(SiteConfigUpdateRequest request) {
    SiteConfig config = siteConfigMapper.selectById(SINGLETON_ID);
    config.setBrandName(text(request.getBrandName(), config.getBrandName()));
    config.setHeroEyebrow(text(request.getHeroEyebrow(), config.getHeroEyebrow()));
    config.setHeroTitle(text(request.getHeroTitle(), config.getHeroTitle()));
    config.setHeroDescription(text(request.getHeroDescription(), config.getHeroDescription()));
    config.setHeroImage(text(request.getHeroImage(), config.getHeroImage()));
    config.setPrimaryCtaText(text(request.getPrimaryCtaText(), config.getPrimaryCtaText()));
    config.setSecondaryCtaText(text(request.getSecondaryCtaText(), config.getSecondaryCtaText()));
    config.setContactIntro(text(request.getContactIntro(), config.getContactIntro()));
    config.setBusinessHoursText(text(request.getBusinessHoursText(), config.getBusinessHoursText()));
    config.setFooterDescription(text(request.getFooterDescription(), config.getFooterDescription()));
    siteConfigMapper.updateById(config);
    replaceStats(request.getStats());

    ShopInfo shopInfo = shopInfoMapper.selectById(SINGLETON_ID);
    shopInfo.setName(config.getBrandName());
    shopInfo.setPhone(text(request.getPhone(), shopInfo.getPhone()));
    shopInfo.setWechat(text(request.getWechat(), shopInfo.getWechat()));
    shopInfo.setAddress(text(request.getAddress(), shopInfo.getAddress()));
    shopInfo.setLatitude(decimal(request.getLatitude(), shopInfo.getLatitude()));
    shopInfo.setLongitude(decimal(request.getLongitude(), shopInfo.getLongitude()));
    shopInfoMapper.updateById(shopInfo);

    BrandStory story = brandStoryMapper.selectById(SINGLETON_ID);
    story.setTitle(text(request.getStoryTitle(), story.getTitle()));
    story.setSubtitle(text(request.getStorySubtitle(), story.getSubtitle()));
    story.setContent(text(request.getStoryContent(), story.getContent()));
    brandStoryMapper.updateById(story);
    replaceStoryImages(request.getStoryImages());

    return new SiteConfigUpdateResponse(getSiteConfig(), getShopInfo(), getBrandStory());
  }

  private void replaceStats(List<SiteStatResponse> stats) {
    if (stats == null) return;
    siteConfigStatMapper.delete(null);
    for (int i = 0; i < stats.size(); i++) {
      SiteStatResponse stat = stats.get(i);
      if (stat.getValue() == null || stat.getValue().isBlank() || stat.getLabel() == null || stat.getLabel().isBlank()) continue;
      SiteConfigStat entity = new SiteConfigStat();
      entity.setValue(stat.getValue().trim());
      entity.setLabel(stat.getLabel().trim());
      entity.setSort(i);
      siteConfigStatMapper.insert(entity);
    }
  }

  private void replaceStoryImages(List<String> images) {
    if (images == null) return;
    brandStoryImageMapper.delete(null);
    for (int i = 0; i < images.size(); i++) {
      String image = images.get(i);
      if (image == null || image.isBlank()) continue;
      BrandStoryImage entity = new BrandStoryImage();
      entity.setImageUrl(image.trim());
      entity.setSort(i);
      brandStoryImageMapper.insert(entity);
    }
  }

  private BusinessHoursResponse getBusinessHours() {
    BusinessHoursResponse hours = new BusinessHoursResponse();
    List<ShopHour> rows = shopHourMapper.selectList(new LambdaQueryWrapper<ShopHour>().orderByAsc(ShopHour::getId));
    for (ShopHour row : rows) {
      TimeRangeResponse range = new TimeRangeResponse();
      range.setOpen(row.getOpenTime());
      range.setClose(row.getCloseTime());
      range.setOff(row.getOff());
      switch (row.getWeekday()) {
        case "monday" -> hours.setMonday(range);
        case "tuesday" -> hours.setTuesday(range);
        case "wednesday" -> hours.setWednesday(range);
        case "thursday" -> hours.setThursday(range);
        case "friday" -> hours.setFriday(range);
        case "saturday" -> hours.setSaturday(range);
        case "sunday" -> hours.setSunday(range);
        default -> {
        }
      }
    }
    return hours;
  }

  private SiteStatResponse toStatResponse(SiteConfigStat stat) {
    SiteStatResponse response = new SiteStatResponse();
    response.setValue(stat.getValue());
    response.setLabel(stat.getLabel());
    return response;
  }

  private String text(String next, String current) {
    return next == null ? current : next.trim();
  }

  private BigDecimal decimal(BigDecimal next, BigDecimal current) {
    return next == null ? current : next;
  }
}

