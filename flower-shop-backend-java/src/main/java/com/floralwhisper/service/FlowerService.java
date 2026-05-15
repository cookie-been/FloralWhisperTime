package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.FlowerRequest;
import com.floralwhisper.dto.FlowerResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.entity.Flower;
import com.floralwhisper.entity.FlowerImage;
import com.floralwhisper.entity.FlowerMaterial;
import com.floralwhisper.entity.FlowerTag;
import com.floralwhisper.mapper.FlowerImageMapper;
import com.floralwhisper.mapper.FlowerMapper;
import com.floralwhisper.mapper.FlowerMaterialMapper;
import com.floralwhisper.mapper.FlowerTagMapper;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FlowerService {
  private static final DateTimeFormatter API_CREATED_AT_FORMATTER = DateTimeFormatter.ISO_INSTANT;

  private final FlowerMapper flowerMapper;
  private final FlowerImageMapper flowerImageMapper;
  private final FlowerMaterialMapper flowerMaterialMapper;
  private final FlowerTagMapper flowerTagMapper;
  private final AuditLogService auditLogService;

  public FlowerService(
      FlowerMapper flowerMapper,
      FlowerImageMapper flowerImageMapper,
      FlowerMaterialMapper flowerMaterialMapper,
      FlowerTagMapper flowerTagMapper,
      AuditLogService auditLogService) {
    this.flowerMapper = flowerMapper;
    this.flowerImageMapper = flowerImageMapper;
    this.flowerMaterialMapper = flowerMaterialMapper;
    this.flowerTagMapper = flowerTagMapper;
    this.auditLogService = auditLogService;
  }

  public PaginatedResult<FlowerResponse> list(String categoryId, String tag, String keyword, String sortBy, Integer page, Integer limit) {
    int currentPage = page == null || page < 1 ? 1 : page;
    int pageSize = limit == null || limit < 1 ? 20 : limit;
    String normalizedKeyword = keyword == null ? "" : keyword.trim().toLowerCase();

    List<FlowerResponse> filtered = flowerMapper.selectList(null).stream()
        .map(this::toResponse)
        .filter(flower -> categoryId == null || categoryId.isBlank() || "all".equals(categoryId) || categoryId.equals(flower.getCategoryId()))
        .filter(flower -> tag == null || tag.isBlank() || flower.getTags().contains(tag))
        .filter(flower -> normalizedKeyword.isBlank() || keywordMatched(flower, normalizedKeyword))
        .sorted(comparator(sortBy))
        .toList();

    int from = Math.min((currentPage - 1) * pageSize, filtered.size());
    int to = Math.min(from + pageSize, filtered.size());
    return new PaginatedResult<>(filtered.subList(from, to), filtered.size(), currentPage, pageSize);
  }

  public FlowerResponse getById(String id) {
    Flower flower = flowerMapper.selectById(id);
    if (flower == null) throw new ApiException(HttpStatus.NOT_FOUND, "作品不存在");
    return toResponse(flower);
  }

  public List<FlowerResponse> related(String id, Integer limit) {
    FlowerResponse current = getById(id);
    Set<String> tags = Set.copyOf(current.getTags());
    int size = limit == null || limit < 1 ? 3 : limit;
    return flowerMapper.selectList(null).stream()
        .filter(flower -> !Objects.equals(flower.getId(), current.getId()))
        .map(this::toResponse)
        .filter(flower -> Objects.equals(flower.getCategoryId(), current.getCategoryId()) || flower.getTags().stream().anyMatch(tags::contains))
        .sorted(comparator(null))
        .limit(size)
        .toList();
  }

  @Transactional
  public FlowerResponse create(FlowerRequest request) {
    String id = normalizeText(request.getId());
    if (id == null || id.isBlank()) id = request.getCategoryId() + "_" + System.currentTimeMillis();
    if (flowerMapper.selectById(id) != null) {
      throw new ApiException(HttpStatus.CONFLICT, "作品 ID 已存在");
    }
    Flower flower = toEntity(request, id);
    flowerMapper.insert(flower);
    replaceChildren(id, request);
    FlowerResponse created = getById(id);
    auditLogService.record(AuditLogCommand.builder()
        .module("FLOWER")
        .action("CREATE")
        .targetType("FLOWER")
        .targetId(id)
        .requestSummary(request)
        .beforeSnapshot(null)
        .afterSnapshot(created)
        .success(true)
        .build());
    return created;
  }

  @Transactional
  public FlowerResponse update(String id, FlowerRequest request) {
    if (flowerMapper.selectById(id) == null) throw new ApiException(HttpStatus.NOT_FOUND, "作品不存在");
    FlowerResponse before = getById(id);
    Flower flower = toEntity(request, id);
    flowerMapper.updateById(flower);
    replaceChildren(id, request);
    FlowerResponse updated = getById(id);
    auditLogService.record(AuditLogCommand.builder()
        .module("FLOWER")
        .action("UPDATE")
        .targetType("FLOWER")
        .targetId(id)
        .requestSummary(request)
        .beforeSnapshot(before)
        .afterSnapshot(updated)
        .success(true)
        .build());
    return updated;
  }

  @Transactional
  public void delete(String id) {
    if (flowerMapper.selectById(id) == null) throw new ApiException(HttpStatus.NOT_FOUND, "作品不存在");
    FlowerResponse before = getById(id);
    deleteChildren(id);
    flowerMapper.deleteById(id);
    auditLogService.record(AuditLogCommand.builder()
        .module("FLOWER")
        .action("DELETE")
        .targetType("FLOWER")
        .targetId(id)
        .requestSummary(java.util.Map.of("id", id))
        .beforeSnapshot(before)
        .afterSnapshot(null)
        .success(true)
        .build());
  }

  private Flower toEntity(FlowerRequest request, String id) {
    Flower flower = new Flower();
    flower.setId(id);
    flower.setName(normalizeText(request.getName()));
    flower.setCategoryId(normalizeText(request.getCategoryId()));
    flower.setPrice(request.getPrice() == null ? BigDecimal.ZERO : request.getPrice());
    flower.setDescription(normalizeText(request.getDescription()));
    flower.setMeaning(normalizeText(request.getMeaning()));
    flower.setFeatured(Boolean.TRUE.equals(request.getFeatured()));
    flower.setSort(request.getSort() == null ? 0 : request.getSort());
    flower.setCreatedAt(parseDate(request.getCreatedAt()));
    return flower;
  }

  private LocalDateTime parseDate(String value) {
    if (value == null || value.isBlank()) return LocalDateTime.now();
    try {
      return OffsetDateTime.parse(value).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
    } catch (DateTimeParseException ignored) {
      try {
        return LocalDateTime.parse(value);
      } catch (DateTimeParseException nestedIgnored) {
        return LocalDateTime.now();
      }
    }
  }

  private FlowerResponse toResponse(Flower flower) {
    FlowerResponse response = new FlowerResponse();
    response.setId(flower.getId());
    response.setName(flower.getName());
    response.setCategoryId(flower.getCategoryId());
    response.setPrice(flower.getPrice());
    response.setDescription(flower.getDescription());
    response.setMeaning(flower.getMeaning());
    response.setFeatured(Boolean.TRUE.equals(flower.getFeatured()));
    response.setSort(flower.getSort() == null ? 0 : flower.getSort());
    response.setCreatedAt(flower.getCreatedAt() == null
        ? API_CREATED_AT_FORMATTER.format(Instant.now())
        : API_CREATED_AT_FORMATTER.format(flower.getCreatedAt().toInstant(ZoneOffset.UTC)));
    response.setImages(selectImages(flower.getId()));
    response.setMaterials(selectMaterials(flower.getId()));
    response.setTags(selectTags(flower.getId()));
    return response;
  }

  private void replaceChildren(String flowerId, FlowerRequest request) {
    deleteChildren(flowerId);
    insertImages(flowerId, request.getImages());
    insertMaterials(flowerId, request.getMaterials());
    insertTags(flowerId, request.getTags());
  }

  private void deleteChildren(String flowerId) {
    flowerImageMapper.delete(new LambdaQueryWrapper<FlowerImage>().eq(FlowerImage::getFlowerId, flowerId));
    flowerMaterialMapper.delete(new LambdaQueryWrapper<FlowerMaterial>().eq(FlowerMaterial::getFlowerId, flowerId));
    flowerTagMapper.delete(new LambdaQueryWrapper<FlowerTag>().eq(FlowerTag::getFlowerId, flowerId));
  }

  private void insertImages(String flowerId, List<String> images) {
    List<String> normalized = normalizeList(images);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerImage item = new FlowerImage();
      item.setFlowerId(flowerId);
      item.setImageUrl(normalized.get(i));
      item.setSort(i);
      flowerImageMapper.insert(item);
    }
  }

  private void insertMaterials(String flowerId, List<String> materials) {
    List<String> normalized = normalizeList(materials);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerMaterial item = new FlowerMaterial();
      item.setFlowerId(flowerId);
      item.setMaterial(normalized.get(i));
      item.setSort(i);
      flowerMaterialMapper.insert(item);
    }
  }

  private void insertTags(String flowerId, List<String> tags) {
    List<String> normalized = normalizeList(tags);
    for (int i = 0; i < normalized.size(); i++) {
      FlowerTag item = new FlowerTag();
      item.setFlowerId(flowerId);
      item.setTag(normalized.get(i));
      item.setSort(i);
      flowerTagMapper.insert(item);
    }
  }

  private List<String> selectImages(String flowerId) {
    return flowerImageMapper.selectList(new LambdaQueryWrapper<FlowerImage>().eq(FlowerImage::getFlowerId, flowerId).orderByAsc(FlowerImage::getSort))
        .stream().map(FlowerImage::getImageUrl).toList();
  }

  private List<String> selectMaterials(String flowerId) {
    return flowerMaterialMapper.selectList(new LambdaQueryWrapper<FlowerMaterial>().eq(FlowerMaterial::getFlowerId, flowerId).orderByAsc(FlowerMaterial::getSort))
        .stream().map(FlowerMaterial::getMaterial).toList();
  }

  private List<String> selectTags(String flowerId) {
    return flowerTagMapper.selectList(new LambdaQueryWrapper<FlowerTag>().eq(FlowerTag::getFlowerId, flowerId).orderByAsc(FlowerTag::getSort))
        .stream().map(FlowerTag::getTag).toList();
  }

  private List<String> normalizeList(List<String> values) {
    if (values == null) return List.of();
    return values.stream().map(this::normalizeText).filter(value -> value != null && !value.isBlank()).collect(Collectors.toList());
  }

  private String normalizeText(String value) {
    return value == null ? "" : value.trim();
  }

  private boolean keywordMatched(FlowerResponse flower, String keyword) {
    String haystack = String.join(" ", flower.getName(), flower.getDescription(), flower.getMeaning(),
        String.join(" ", flower.getMaterials()), String.join(" ", flower.getTags())).toLowerCase();
    return haystack.contains(keyword);
  }

  private Comparator<FlowerResponse> comparator(String sortBy) {
    if ("latest".equals(sortBy)) return Comparator.comparing(FlowerResponse::getCreatedAt, Comparator.nullsLast(String::compareTo)).reversed();
    if ("price_asc".equals(sortBy)) return Comparator.comparing(FlowerResponse::getPrice, Comparator.nullsLast(BigDecimal::compareTo));
    if ("price_desc".equals(sortBy)) return Comparator.comparing(FlowerResponse::getPrice, Comparator.nullsLast(BigDecimal::compareTo)).reversed();
    if ("featured".equals(sortBy)) {
      return Comparator.comparing((FlowerResponse flower) -> Boolean.TRUE.equals(flower.getFeatured())).reversed()
          .thenComparing(Comparator.comparing(FlowerResponse::getSort, Comparator.nullsLast(Integer::compareTo)).reversed());
    }
    return Comparator.comparing(FlowerResponse::getSort, Comparator.nullsLast(Integer::compareTo)).reversed();
  }
}
