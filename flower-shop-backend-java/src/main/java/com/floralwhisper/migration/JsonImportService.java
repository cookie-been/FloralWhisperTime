package com.floralwhisper.migration;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.Flower;
import com.floralwhisper.entity.FlowerImage;
import com.floralwhisper.entity.FlowerMaterial;
import com.floralwhisper.entity.FlowerTag;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.ContactMapper;
import com.floralwhisper.mapper.FlowerImageMapper;
import com.floralwhisper.mapper.FlowerMapper;
import com.floralwhisper.mapper.FlowerMaterialMapper;
import com.floralwhisper.mapper.FlowerTagMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class JsonImportService {
  private static final Logger log = LoggerFactory.getLogger(JsonImportService.class);
  private static final long SINGLETON_ID = 1L;

  private final ObjectMapper objectMapper;
  private final CategoryMapper categoryMapper;
  private final FlowerMapper flowerMapper;
  private final FlowerImageMapper flowerImageMapper;
  private final FlowerMaterialMapper flowerMaterialMapper;
  private final FlowerTagMapper flowerTagMapper;
  private final SiteConfigMapper siteConfigMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final ShopHourMapper shopHourMapper;
  private final BrandStoryMapper brandStoryMapper;
  private final BrandStoryImageMapper brandStoryImageMapper;
  private final TeamMemberMapper teamMemberMapper;
  private final ContactMapper contactMapper;

  public JsonImportService(
      ObjectMapper objectMapper,
      CategoryMapper categoryMapper,
      FlowerMapper flowerMapper,
      FlowerImageMapper flowerImageMapper,
      FlowerMaterialMapper flowerMaterialMapper,
      FlowerTagMapper flowerTagMapper,
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      TeamMemberMapper teamMemberMapper,
      ContactMapper contactMapper) {
    this.objectMapper = objectMapper;
    this.categoryMapper = categoryMapper;
    this.flowerMapper = flowerMapper;
    this.flowerImageMapper = flowerImageMapper;
    this.flowerMaterialMapper = flowerMaterialMapper;
    this.flowerTagMapper = flowerTagMapper;
    this.siteConfigMapper = siteConfigMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.brandStoryMapper = brandStoryMapper;
    this.brandStoryImageMapper = brandStoryImageMapper;
    this.teamMemberMapper = teamMemberMapper;
    this.contactMapper = contactMapper;
  }

  @Transactional
  public ImportSummary importFromJson(Path path, boolean replaceExisting) {
    JsonImportModels.LegacyDb legacyDb = readLegacyDb(path);
    if (hasExistingData() && !replaceExisting) {
      throw new IllegalStateException("数据库已存在数据，若确认覆盖导入，请设置 JSON_IMPORT_REPLACE_EXISTING=true");
    }
    if (replaceExisting) {
      clearExistingData();
    }

    int categories = importCategories(legacyDb.getCategories());
    FlowerCounts flowerCounts = importFlowers(legacyDb.getFlowers());
    SiteContentCounts siteCounts = importSiteContent(legacyDb);
    int contacts = importContacts(legacyDb.getContacts());

    ImportSummary summary = new ImportSummary(
        categories,
        flowerCounts.flowers(),
        flowerCounts.images(),
        flowerCounts.materials(),
        flowerCounts.tags(),
        siteCounts.storyImages(),
        siteCounts.teamMembers(),
        siteCounts.shopHours(),
        contacts);
    log.info(
        "JSON import completed: categories={}, flowers={}, images={}, materials={}, tags={}, storyImages={}, teamMembers={}, shopHours={}, contacts={}",
        summary.categories(),
        summary.flowers(),
        summary.images(),
        summary.materials(),
        summary.tags(),
        summary.storyImages(),
        summary.teamMembers(),
        summary.shopHours(),
        summary.contacts());
    return summary;
  }

  JsonImportModels.LegacyDb readLegacyDb(Path path) {
    if (path == null || path.toString().isBlank()) {
      throw new IllegalArgumentException("JSON 导入路径不能为空");
    }
    if (!Files.exists(path)) {
      throw new IllegalArgumentException("JSON 导入文件不存在: " + path);
    }
    try {
      return objectMapper.readValue(path.toFile(), JsonImportModels.LegacyDb.class);
    } catch (IOException error) {
      throw new IllegalArgumentException("JSON 导入文件格式不正确: " + path, error);
    }
  }

  private boolean hasExistingData() {
    return count(categoryMapper.selectCount(null)) > 0
        || count(flowerMapper.selectCount(null)) > 0
        || siteConfigMapper.selectById(SINGLETON_ID) != null
        || shopInfoMapper.selectById(SINGLETON_ID) != null
        || brandStoryMapper.selectById(SINGLETON_ID) != null
        || count(teamMemberMapper.selectCount(null)) > 0
        || count(contactMapper.selectCount(null)) > 0;
  }

  private void clearExistingData() {
    flowerImageMapper.delete(null);
    flowerMaterialMapper.delete(null);
    flowerTagMapper.delete(null);
    brandStoryImageMapper.delete(null);
    shopHourMapper.delete(null);
    contactMapper.delete(null);
    teamMemberMapper.delete(null);
    flowerMapper.delete(null);
    brandStoryMapper.delete(null);
    shopInfoMapper.delete(null);
    siteConfigMapper.delete(null);
    categoryMapper.delete(null);
  }

  private int importCategories(List<JsonImportModels.CategoryRecord> records) {
    int count = 0;
    for (JsonImportModels.CategoryRecord record : safeList(records)) {
      if (blank(record.getId())) {
        throw new IllegalArgumentException("分类 ID 不能为空");
      }
      Category entity = new Category();
      entity.setId(record.getId().trim());
      entity.setName(text(record.getName()));
      entity.setIcon(text(record.getIcon()));
      entity.setDescription(text(record.getDescription()));
      entity.setSort(record.getSort() == null ? 0 : record.getSort());
      categoryMapper.insert(entity);
      count++;
    }
    return count;
  }

  private FlowerCounts importFlowers(List<JsonImportModels.FlowerRecord> records) {
    int flowers = 0;
    int images = 0;
    int materials = 0;
    int tags = 0;
    for (JsonImportModels.FlowerRecord record : safeList(records)) {
      if (blank(record.getId()) || blank(record.getName()) || blank(record.getCategoryId())) {
        throw new IllegalArgumentException("作品导入缺少必填字段");
      }
      Flower entity = new Flower();
      entity.setId(record.getId().trim());
      entity.setName(text(record.getName()));
      entity.setCategoryId(text(record.getCategoryId()));
      entity.setPrice(record.getPrice() == null ? BigDecimal.ZERO : record.getPrice());
      entity.setDescription(text(record.getDescription()));
      entity.setMeaning(text(record.getMeaning()));
      entity.setFeatured(Boolean.TRUE.equals(record.getFeatured()));
      entity.setSort(record.getSort() == null ? 0 : record.getSort());
      entity.setCreatedAt(parseDateTime(record.getCreatedAt()));
      flowerMapper.insert(entity);
      flowers++;

      images += insertFlowerImages(entity.getId(), record.getImages());
      materials += insertFlowerMaterials(entity.getId(), record.getMaterials());
      tags += insertFlowerTags(entity.getId(), record.getTags());
    }
    return new FlowerCounts(flowers, images, materials, tags);
  }

  private int insertFlowerImages(String flowerId, List<String> values) {
    int count = 0;
    List<String> normalized = normalizeList(values);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerImage entity = new FlowerImage();
      entity.setFlowerId(flowerId);
      entity.setImageUrl(normalized.get(i));
      entity.setSort(i);
      flowerImageMapper.insert(entity);
      count++;
    }
    return count;
  }

  private int insertFlowerMaterials(String flowerId, List<String> values) {
    int count = 0;
    List<String> normalized = normalizeList(values);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerMaterial entity = new FlowerMaterial();
      entity.setFlowerId(flowerId);
      entity.setMaterial(normalized.get(i));
      entity.setSort(i);
      flowerMaterialMapper.insert(entity);
      count++;
    }
    return count;
  }

  private int insertFlowerTags(String flowerId, List<String> values) {
    int count = 0;
    List<String> normalized = normalizeList(values);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerTag entity = new FlowerTag();
      entity.setFlowerId(flowerId);
      entity.setTag(normalized.get(i));
      entity.setSort(i);
      flowerTagMapper.insert(entity);
      count++;
    }
    return count;
  }

  private SiteContentCounts importSiteContent(JsonImportModels.LegacyDb legacyDb) {
    importSiteConfig(legacyDb.getSiteConfig(), legacyDb.getShopInfo());
    int shopHours = importShopInfo(legacyDb.getShopInfo());
    int storyImages = importBrandStory(legacyDb.getBrandStory());
    int teamMembers = importTeamMembers(legacyDb.getTeamMembers());
    return new SiteContentCounts(storyImages, teamMembers, shopHours);
  }

  private void importSiteConfig(JsonImportModels.SiteConfigRecord record, JsonImportModels.ShopInfoRecord shopInfoRecord) {
    JsonImportModels.SiteConfigRecord source = record == null ? new JsonImportModels.SiteConfigRecord() : record;
    SiteConfig entity = new SiteConfig();
    entity.setId(SINGLETON_ID);
    entity.setBrandName(fallback(source.getBrandName(), shopInfoRecord != null ? shopInfoRecord.getName() : null, "花语时光"));
    entity.setHeroEyebrow(fallback(source.getHeroEyebrow(), "清新文艺 · 自然温暖"));
    entity.setHeroTitle(fallback(source.getHeroTitle(), entity.getBrandName()));
    entity.setHeroDescription(fallback(source.getHeroDescription(), "用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。"));
    entity.setHeroImage(fallback(source.getHeroImage(), ""));
    entity.setPrimaryCtaText(fallback(source.getPrimaryCtaText(), "浏览作品"));
    entity.setSecondaryCtaText(fallback(source.getSecondaryCtaText(), "联系门店"));
    entity.setContactIntro(fallback(source.getContactIntro(), "欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。"));
    entity.setBusinessHoursText(fallback(source.getBusinessHoursText(), "周一至周五 09:30-21:00，周末 10:00-21:30"));
    entity.setFooterDescription(fallback(source.getFooterDescription(), "纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。"));
    siteConfigMapper.insert(entity);
  }

  private int importShopInfo(JsonImportModels.ShopInfoRecord record) {
    ShopInfo entity = new ShopInfo();
    entity.setId(SINGLETON_ID);
    entity.setName(fallback(record != null ? record.getName() : null, "花语时光"));
    entity.setPhone(record == null ? "" : text(record.getPhone()));
    entity.setWechat(record == null ? "" : text(record.getWechat()));
    entity.setAddress(record == null ? "" : text(record.getAddress()));
    entity.setLatitude(record == null || record.getLatitude() == null ? BigDecimal.ZERO : record.getLatitude());
    entity.setLongitude(record == null || record.getLongitude() == null ? BigDecimal.ZERO : record.getLongitude());
    shopInfoMapper.insert(entity);

    if (record == null || record.getHours() == null) {
      return 0;
    }
    int count = 0;
    count += insertShopHour("monday", record.getHours().getMonday());
    count += insertShopHour("tuesday", record.getHours().getTuesday());
    count += insertShopHour("wednesday", record.getHours().getWednesday());
    count += insertShopHour("thursday", record.getHours().getThursday());
    count += insertShopHour("friday", record.getHours().getFriday());
    count += insertShopHour("saturday", record.getHours().getSaturday());
    count += insertShopHour("sunday", record.getHours().getSunday());
    return count;
  }

  private int insertShopHour(String weekday, JsonImportModels.TimeRangeRecord record) {
    if (record == null) {
      return 0;
    }
    ShopHour entity = new ShopHour();
    entity.setWeekday(weekday);
    entity.setOpenTime(fallback(record.getOpen(), ""));
    entity.setCloseTime(fallback(record.getClose(), ""));
    entity.setOff(Boolean.TRUE.equals(record.getOff()));
    shopHourMapper.insert(entity);
    return 1;
  }

  private int importBrandStory(JsonImportModels.BrandStoryRecord record) {
    BrandStory entity = new BrandStory();
    entity.setId(SINGLETON_ID);
    entity.setTitle(fallback(record != null ? record.getTitle() : null, "让花束像一封慢慢抵达的信"));
    entity.setSubtitle(fallback(record != null ? record.getSubtitle() : null, ""));
    entity.setContent(fallback(record != null ? record.getContent() : null, ""));
    brandStoryMapper.insert(entity);

    int count = 0;
    List<String> images = record == null ? List.of() : normalizeList(record.getImages());
    for (int i = 0; i < images.size(); i++) {
      BrandStoryImage image = new BrandStoryImage();
      image.setImageUrl(images.get(i));
      image.setSort(i);
      brandStoryImageMapper.insert(image);
      count++;
    }
    return count;
  }

  private int importTeamMembers(List<JsonImportModels.TeamMemberRecord> records) {
    int count = 0;
    List<JsonImportModels.TeamMemberRecord> source = safeList(records);
    for (int i = 0; i < source.size(); i++) {
      JsonImportModels.TeamMemberRecord record = source.get(i);
      if (blank(record.getId()) || blank(record.getName()) || blank(record.getTitle()) || blank(record.getAvatar())) {
        throw new IllegalArgumentException("团队成员导入缺少必填字段");
      }
      TeamMember entity = new TeamMember();
      entity.setId(record.getId().trim());
      entity.setName(record.getName().trim());
      entity.setTitle(record.getTitle().trim());
      entity.setAvatar(record.getAvatar().trim());
      entity.setBio(text(record.getBio()));
      entity.setSort(record.getSort() == null ? source.size() - i : record.getSort());
      teamMemberMapper.insert(entity);
      count++;
    }
    return count;
  }

  private int importContacts(List<JsonImportModels.ContactRecord> records) {
    int count = 0;
    for (JsonImportModels.ContactRecord record : safeList(records)) {
      if (blank(record.getName()) || blank(record.getPhone()) || blank(record.getMessage())) {
        continue;
      }
      Contact entity = new Contact();
      entity.setId(fallback(record.getId(), "contact_import_" + System.nanoTime()));
      entity.setName(record.getName().trim());
      entity.setPhone(record.getPhone().trim());
      entity.setMessage(record.getMessage().trim());
      entity.setCreatedAt(parseDateTime(record.getCreatedAt()));
      contactMapper.insert(entity);
      count++;
    }
    return count;
  }

  private LocalDateTime parseDateTime(String value) {
    if (blank(value)) {
      return LocalDateTime.now();
    }
    try {
      return OffsetDateTime.parse(value.trim()).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
    } catch (DateTimeParseException ignored) {
      try {
        return LocalDateTime.parse(value.trim());
      } catch (DateTimeParseException nestedIgnored) {
        return LocalDateTime.now();
      }
    }
  }

  private List<String> normalizeList(List<String> values) {
    return safeList(values).stream().map(this::text).filter(value -> !value.isBlank()).toList();
  }

  private <T> List<T> safeList(List<T> values) {
    return values == null ? List.of() : values;
  }

  private String text(String value) {
    return value == null ? "" : value.trim();
  }

  private String fallback(String primary, String secondary) {
    if (!blank(primary)) {
      return primary.trim();
    }
    return secondary == null ? "" : secondary.trim();
  }

  private String fallback(String primary, String secondary, String fallback) {
    String value = fallback(primary, secondary);
    return value.isBlank() ? fallback : value;
  }

  private boolean blank(String value) {
    return value == null || value.isBlank();
  }

  private long count(Long value) {
    return value == null ? 0L : value;
  }

  public record ImportSummary(
      int categories,
      int flowers,
      int images,
      int materials,
      int tags,
      int storyImages,
      int teamMembers,
      int shopHours,
      int contacts) {}

  private record FlowerCounts(int flowers, int images, int materials, int tags) {}

  private record SiteContentCounts(int storyImages, int teamMembers, int shopHours) {}
}
