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
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
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
  private final CategoryMapper categoryMapper;
  private final TeamMemberMapper teamMemberMapper;

  public SiteService(
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      TeamMemberMapper teamMemberMapper) {
    this.siteConfigMapper = siteConfigMapper;
    this.siteConfigStatMapper = siteConfigStatMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.brandStoryMapper = brandStoryMapper;
    this.brandStoryImageMapper = brandStoryImageMapper;
    this.categoryMapper = categoryMapper;
    this.teamMemberMapper = teamMemberMapper;
  }

  public SiteConfigResponse getSiteConfig() {
    SiteConfig config = ensureSiteConfig();
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
    ShopInfo shopInfo = ensureShopInfo();
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
    BrandStory story = ensureBrandStory();
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
    SiteConfig config = ensureSiteConfig();
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

    ShopInfo shopInfo = ensureShopInfo();
    shopInfo.setName(config.getBrandName());
    shopInfo.setPhone(text(request.getPhone(), shopInfo.getPhone()));
    shopInfo.setWechat(text(request.getWechat(), shopInfo.getWechat()));
    shopInfo.setAddress(text(request.getAddress(), shopInfo.getAddress()));
    shopInfo.setLatitude(decimal(request.getLatitude(), shopInfo.getLatitude()));
    shopInfo.setLongitude(decimal(request.getLongitude(), shopInfo.getLongitude()));
    shopInfoMapper.updateById(shopInfo);

    BrandStory story = ensureBrandStory();
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
    ensureDefaultHours();
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

  private SiteConfig ensureSiteConfig() {
    SiteConfig current = siteConfigMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    SiteConfig created = new SiteConfig();
    created.setId(SINGLETON_ID);
    ShopInfo shopInfo = shopInfoMapper.selectById(SINGLETON_ID);
    created.setBrandName(shopInfo != null && notBlank(shopInfo.getName()) ? shopInfo.getName() : "花语时光");
    created.setHeroEyebrow("清新文艺 · 自然温暖");
    created.setHeroTitle(created.getBrandName());
    created.setHeroDescription("用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。");
    created.setHeroImage("https://picsum.photos/seed/floral-hero/1920/1080");
    created.setPrimaryCtaText("浏览作品");
    created.setSecondaryCtaText("联系门店");
    created.setContactIntro("欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。");
    created.setBusinessHoursText("周一至周五 09:30-21:00，周末 10:00-21:30");
    created.setFooterDescription("纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。");
    siteConfigMapper.insert(created);
    ensureDefaultStats();
    return created;
  }

  private ShopInfo ensureShopInfo() {
    ShopInfo current = shopInfoMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    ShopInfo created = new ShopInfo();
    created.setId(SINGLETON_ID);
    created.setName("花语时光");
    created.setPhone("");
    created.setWechat("");
    created.setAddress("");
    created.setLatitude(BigDecimal.ZERO);
    created.setLongitude(BigDecimal.ZERO);
    shopInfoMapper.insert(created);
    ensureDefaultHours();
    return created;
  }

  private BrandStory ensureBrandStory() {
    BrandStory current = brandStoryMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    BrandStory created = new BrandStory();
    created.setId(SINGLETON_ID);
    created.setTitle("让花束像一封慢慢抵达的信");
    created.setSubtitle("花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。");
    created.setContent("我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。");
    brandStoryMapper.insert(created);
    return created;
  }

  private void ensureDefaultStats() {
    if (!siteConfigStatMapper.selectList(null).isEmpty()) return;
    insertDefaultStat(0, "860+", "已服务客户");
    insertDefaultStat(1, "320+", "花艺作品");
    insertDefaultStat(2, String.valueOf(defaultCategoryCount()), "主题分类");
  }

  private void insertDefaultStat(int sort, String value, String label) {
    SiteConfigStat entity = new SiteConfigStat();
    entity.setSort(sort);
    entity.setValue(value);
    entity.setLabel(label);
    siteConfigStatMapper.insert(entity);
  }

  private int defaultCategoryCount() {
    return (int) categoryMapper.selectList(null).stream().map(Category::getId).filter(id -> id != null && !"all".equals(id)).count();
  }

  private void ensureDefaultHours() {
    if (!shopHourMapper.selectList(null).isEmpty()) return;
    insertDefaultHour("monday", "09:30", "21:00", false);
    insertDefaultHour("tuesday", "09:30", "21:00", false);
    insertDefaultHour("wednesday", "09:30", "21:00", false);
    insertDefaultHour("thursday", "09:30", "21:00", false);
    insertDefaultHour("friday", "09:30", "21:30", false);
    insertDefaultHour("saturday", "10:00", "21:30", false);
    insertDefaultHour("sunday", "10:00", "20:30", false);
  }

  private void insertDefaultHour(String weekday, String openTime, String closeTime, boolean off) {
    ShopHour entity = new ShopHour();
    entity.setWeekday(weekday);
    entity.setOpenTime(openTime);
    entity.setCloseTime(closeTime);
    entity.setOff(off);
    shopHourMapper.insert(entity);
  }

  private boolean notBlank(String value) {
    return value != null && !value.isBlank();
  }
}
