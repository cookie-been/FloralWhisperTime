package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutPageUpdateRequest;
import com.floralwhisper.dto.AboutTimelineEntryRequest;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.AiSettingsUpdateRequest;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.BusinessHoursResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.dto.SiteStatResponse;
import com.floralwhisper.dto.TeamMemberRequest;
import com.floralwhisper.dto.TimeRangeResponse;
import com.floralwhisper.entity.AboutPage;
import com.floralwhisper.entity.AboutTimelineEntry;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
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
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteService {
  private static final long SINGLETON_ID = 1L;

  private final SiteConfigMapper siteConfigMapper;
  private final SiteConfigStatMapper siteConfigStatMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final ShopHourMapper shopHourMapper;
  private final AboutPageMapper aboutPageMapper;
  private final AboutTimelineEntryMapper aboutTimelineEntryMapper;
  private final AiSettingsMapper aiSettingsMapper;
  private final BrandStoryMapper brandStoryMapper;
  private final BrandStoryImageMapper brandStoryImageMapper;
  private final CategoryMapper categoryMapper;
  private final TeamMemberMapper teamMemberMapper;

  public SiteService(
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      TeamMemberMapper teamMemberMapper) {
    this.siteConfigMapper = siteConfigMapper;
    this.siteConfigStatMapper = siteConfigStatMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.aboutPageMapper = aboutPageMapper;
    this.aboutTimelineEntryMapper = aboutTimelineEntryMapper;
    this.aiSettingsMapper = aiSettingsMapper;
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
    response.setAiSettings(toAiSettingsResponse(ensureAiSettings()));
    response.setStats(siteConfigStatMapper.selectList(new LambdaQueryWrapper<SiteConfigStat>().orderByAsc(SiteConfigStat::getSort))
        .stream().map(this::toStatResponse).toList());
    return response;
  }

  public List<Category> getCategories() {
    return categoryMapper.selectList(new LambdaQueryWrapper<Category>().orderByDesc(Category::getSort));
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

  public AboutPageResponse getAboutPage() {
    return toAboutPageResponse(ensureAboutPage());
  }

  public List<AboutTimelineEntryResponse> getAboutTimeline() {
    ensureDefaultTimelineEntries();
    return aboutTimelineEntryMapper.selectList(new LambdaQueryWrapper<AboutTimelineEntry>().orderByAsc(AboutTimelineEntry::getSort))
        .stream().map(this::toAboutTimelineEntryResponse).toList();
  }

  public List<TeamMember> getAdminTeamMembers() {
    ensureDefaultTeamMembers();
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort));
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
    if (request.getStats() != null) {
      replaceStats(request.getStats());
    }

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
    if (request.getStoryImages() != null) {
      replaceStoryImages(request.getStoryImages());
    }
    updateAiSettings(request.getAiSettings());

    return new SiteConfigUpdateResponse(getSiteConfig(), getShopInfo(), getBrandStory());
  }

  @Transactional
  public AboutPageResponse updateAboutPage(AboutPageUpdateRequest request) {
    AboutPage current = ensureAboutPage();
    current.setHeroImage(text(request.getHeroImage(), current.getHeroImage()));
    current.setHeroEyebrow(text(request.getHeroEyebrow(), current.getHeroEyebrow()));
    current.setHeroTitle(text(request.getHeroTitle(), current.getHeroTitle()));
    current.setHeroSubtitle(text(request.getHeroSubtitle(), current.getHeroSubtitle()));
    current.setStoryTitle(text(request.getStoryTitle(), current.getStoryTitle()));
    current.setStoryContent(text(request.getStoryContent(), current.getStoryContent()));
    aboutPageMapper.updateById(current);
    return toAboutPageResponse(current);
  }

  @Transactional
  public AboutTimelineEntryResponse createAboutTimelineEntry(AboutTimelineEntryRequest request) {
    AboutTimelineEntry entity = new AboutTimelineEntry();
    entity.setId(notBlank(request.getId()) ? request.getId().trim() : "timeline_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    entity.setYearLabel(requiredText(request.getYearLabel(), "请输入时间轴年份"));
    entity.setContent(requiredText(request.getContent(), "请输入时间轴内容"));
    entity.setSort(request.getSort() == null ? nextTimelineSort() : request.getSort());
    aboutTimelineEntryMapper.insert(entity);
    return toAboutTimelineEntryResponse(entity);
  }

  @Transactional
  public AboutTimelineEntryResponse updateAboutTimelineEntry(String id, AboutTimelineEntryRequest request) {
    AboutTimelineEntry current = requireTimelineEntry(id);
    current.setYearLabel(requiredText(request.getYearLabel(), "请输入时间轴年份"));
    current.setContent(requiredText(request.getContent(), "请输入时间轴内容"));
    current.setSort(request.getSort() == null ? current.getSort() : request.getSort());
    aboutTimelineEntryMapper.updateById(current);
    return toAboutTimelineEntryResponse(current);
  }

  @Transactional
  public void deleteAboutTimelineEntry(String id) {
    if (aboutTimelineEntryMapper.deleteById(id) == 0) {
      throw new ApiException(HttpStatus.NOT_FOUND, "时间轴条目不存在");
    }
  }

  @Transactional
  public TeamMember createTeamMember(TeamMemberRequest request) {
    TeamMember entity = new TeamMember();
    entity.setId(notBlank(request.getId()) ? request.getId().trim() : "team_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    entity.setName(requiredText(request.getName(), "请输入团队成员姓名"));
    entity.setTitle(requiredText(request.getTitle(), "请输入团队成员职务"));
    entity.setAvatar(requiredText(request.getAvatar(), "请上传团队成员头像"));
    entity.setBio(optionalText(request.getBio()));
    entity.setSort(request.getSort() == null ? nextTeamSort() : request.getSort());
    teamMemberMapper.insert(entity);
    return entity;
  }

  @Transactional
  public TeamMember updateTeamMember(String id, TeamMemberRequest request) {
    TeamMember current = requireTeamMember(id);
    current.setName(requiredText(request.getName(), "请输入团队成员姓名"));
    current.setTitle(requiredText(request.getTitle(), "请输入团队成员职务"));
    current.setAvatar(requiredText(request.getAvatar(), "请上传团队成员头像"));
    current.setBio(optionalText(request.getBio()));
    current.setSort(request.getSort() == null ? current.getSort() : request.getSort());
    teamMemberMapper.updateById(current);
    return current;
  }

  @Transactional
  public void deleteTeamMember(String id) {
    if (teamMemberMapper.deleteById(id) == 0) {
      throw new ApiException(HttpStatus.NOT_FOUND, "团队成员不存在");
    }
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

  private void updateAiSettings(AiSettingsUpdateRequest request) {
    if (request == null) {
      return;
    }
    AiSettings current = ensureAiSettings();
    current.setEnabled(request.getEnabled() == null ? current.getEnabled() : request.getEnabled());
    current.setProvider(text(request.getProvider(), current.getProvider()));
    current.setApiKey(text(request.getApiKey(), current.getApiKey()));
    current.setModel(text(request.getModel(), current.getModel()));
    current.setBaseUrl(text(request.getBaseUrl(), current.getBaseUrl()));
    current.setGeneratePath(text(request.getGeneratePath(), current.getGeneratePath()));
    current.setSize(text(request.getSize(), current.getSize()));
    aiSettingsMapper.updateById(current);
  }

  private AiSettingsResponse toAiSettingsResponse(AiSettings settings) {
    AiSettingsResponse response = new AiSettingsResponse();
    response.setEnabled(Boolean.TRUE.equals(settings.getEnabled()));
    response.setProvider(settings.getProvider());
    response.setApiKey(settings.getApiKey());
    response.setModel(settings.getModel());
    response.setBaseUrl(settings.getBaseUrl());
    response.setGeneratePath(settings.getGeneratePath());
    response.setSize(settings.getSize());
    return response;
  }

  private AboutPageResponse toAboutPageResponse(AboutPage page) {
    AboutPageResponse response = new AboutPageResponse();
    response.setHeroImage(page.getHeroImage());
    response.setHeroEyebrow(page.getHeroEyebrow());
    response.setHeroTitle(page.getHeroTitle());
    response.setHeroSubtitle(page.getHeroSubtitle());
    response.setStoryTitle(page.getStoryTitle());
    response.setStoryContent(page.getStoryContent());
    return response;
  }

  private AboutTimelineEntryResponse toAboutTimelineEntryResponse(AboutTimelineEntry entry) {
    AboutTimelineEntryResponse response = new AboutTimelineEntryResponse();
    response.setId(entry.getId());
    response.setYearLabel(entry.getYearLabel());
    response.setContent(entry.getContent());
    response.setSort(entry.getSort());
    return response;
  }

  private String text(String next, String current) {
    return next == null ? current : next.trim();
  }

  private String optionalText(String value) {
    return value == null ? null : value.trim();
  }

  private String requiredText(String value, String message) {
    if (value == null || value.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, message);
    return value.trim();
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

  private AiSettings ensureAiSettings() {
    AiSettings current = aiSettingsMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    AiSettings created = new AiSettings();
    created.setId(SINGLETON_ID);
    created.setEnabled(false);
    created.setProvider("volcengine");
    created.setModel("Doubao-Seedream-5.0-lite");
    created.setBaseUrl("https://operator.las.cn-beijing.volces.com/api/v1");
    created.setGeneratePath("/images/generations");
    created.setSize("1920x1920");
    aiSettingsMapper.insert(created);
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

  private AboutPage ensureAboutPage() {
    AboutPage current = aboutPageMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    AboutPage created = new AboutPage();
    created.setId(SINGLETON_ID);
    created.setHeroImage("https://picsum.photos/seed/floral-about/1920/1080");
    created.setHeroEyebrow("About Floral Whisper Time");
    created.setHeroTitle("让花束像一封慢慢抵达的信");
    created.setHeroSubtitle("花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。");
    created.setStoryTitle("品牌故事");
    created.setStoryContent("我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。");
    aboutPageMapper.insert(created);
    return created;
  }

  private void ensureDefaultTimelineEntries() {
    if (!aboutTimelineEntryMapper.selectList(null).isEmpty()) return;
    insertTimelineEntry("timeline_2021", "2021", "花语时光第一间工作室成立，专注日常花礼。", 0);
    insertTimelineEntry("timeline_2023", "2023", "开始承接婚礼、展陈与品牌活动花艺设计。", 1);
    insertTimelineEntry("timeline_2026", "2026", "升级双端展示系统，统一展示作品与门店信息。", 2);
  }

  private void insertTimelineEntry(String id, String yearLabel, String content, int sort) {
    AboutTimelineEntry entity = new AboutTimelineEntry();
    entity.setId(id);
    entity.setYearLabel(yearLabel);
    entity.setContent(content);
    entity.setSort(sort);
    aboutTimelineEntryMapper.insert(entity);
  }

  private AboutTimelineEntry requireTimelineEntry(String id) {
    AboutTimelineEntry current = aboutTimelineEntryMapper.selectById(id);
    if (current == null) throw new ApiException(HttpStatus.NOT_FOUND, "时间轴条目不存在");
    return current;
  }

  private int nextTimelineSort() {
    return aboutTimelineEntryMapper.selectList(new LambdaQueryWrapper<AboutTimelineEntry>().orderByDesc(AboutTimelineEntry::getSort))
        .stream().map(AboutTimelineEntry::getSort).filter(value -> value != null).findFirst().orElse(-1) + 1;
  }

  private void ensureDefaultTeamMembers() {
    if (!teamMemberMapper.selectList(null).isEmpty()) return;
    TeamMember one = new TeamMember();
    one.setId("designer_01");
    one.setName("林汐");
    one.setTitle("主理花艺师");
    one.setAvatar("https://picsum.photos/seed/team-1/600/600");
    one.setBio("负责品牌花艺风格、季节系列与空间陈列方向。");
    one.setSort(2);
    teamMemberMapper.insert(one);

    TeamMember two = new TeamMember();
    two.setId("designer_02");
    two.setName("周宁");
    two.setTitle("婚礼与活动花艺师");
    two.setAvatar("https://picsum.photos/seed/team-2/600/600");
    two.setBio("负责婚礼花艺、品牌活动现场和大型空间花艺布置。");
    two.setSort(1);
    teamMemberMapper.insert(two);
  }

  private TeamMember requireTeamMember(String id) {
    TeamMember current = teamMemberMapper.selectById(id);
    if (current == null) throw new ApiException(HttpStatus.NOT_FOUND, "团队成员不存在");
    return current;
  }

  private int nextTeamSort() {
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort))
        .stream().map(TeamMember::getSort).filter(value -> value != null).findFirst().orElse(-1) + 1;
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
