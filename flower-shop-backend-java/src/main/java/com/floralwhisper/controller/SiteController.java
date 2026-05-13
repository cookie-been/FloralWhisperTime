package com.floralwhisper.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.ContactRequest;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import com.floralwhisper.storage.FileStorageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class SiteController {
  private final CategoryMapper categoryMapper;
  private final TeamMemberMapper teamMemberMapper;
  private final SiteService siteService;
  private final ContactService contactService;
  private final FileStorageService fileStorageService;

  public SiteController(
      CategoryMapper categoryMapper,
      TeamMemberMapper teamMemberMapper,
      SiteService siteService,
      ContactService contactService,
      FileStorageService fileStorageService) {
    this.categoryMapper = categoryMapper;
    this.teamMemberMapper = teamMemberMapper;
    this.siteService = siteService;
    this.contactService = contactService;
    this.fileStorageService = fileStorageService;
  }

  @GetMapping("/health")
  public Map<String, Object> health() {
    return Map.of("ok", true, "service", "flower-shop-backend-java");
  }

  @GetMapping("/categories")
  public List<Category> categories() {
    return categoryMapper.selectList(new LambdaQueryWrapper<Category>().orderByDesc(Category::getSort));
  }

  @GetMapping("/site-config")
  public SiteConfigResponse siteConfig() {
    return siteService.getSiteConfig();
  }

  @PutMapping("/site-config")
  public SiteConfigUpdateResponse updateSiteConfig(@RequestBody SiteConfigUpdateRequest request) {
    return siteService.updateSiteConfig(request);
  }

  @GetMapping("/shop-info")
  public ShopInfoResponse shopInfo() {
    return siteService.getShopInfo();
  }

  @GetMapping("/brand-story")
  public BrandStoryResponse brandStory() {
    return siteService.getBrandStory();
  }

  @GetMapping("/team")
  public List<TeamMember> team() {
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort));
  }

  @PostMapping("/contact")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, Boolean> contact(@Valid @RequestBody ContactRequest request) {
    return contactService.create(request);
  }

  @PostMapping("/uploads")
  @ResponseStatus(HttpStatus.CREATED)
  public Map<String, String> upload(@RequestParam("file") MultipartFile file) {
    return fileStorageService.store(file);
  }
}

