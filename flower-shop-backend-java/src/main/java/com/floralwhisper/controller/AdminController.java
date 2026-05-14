package com.floralwhisper.controller;

import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutPageUpdateRequest;
import com.floralwhisper.dto.AboutTimelineEntryRequest;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.dto.TeamMemberRequest;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final AuthService authService;
  private final ContactService contactService;
  private final SiteService siteService;

  public AdminController(AuthService authService, ContactService contactService, SiteService siteService) {
    this.authService = authService;
    this.contactService = contactService;
    this.siteService = siteService;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @GetMapping("/me")
  public Map<String, String> me() {
    return authService.currentAdmin();
  }

  @GetMapping("/contacts")
  public PaginatedResult<Contact> contacts(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer limit,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String status) {
    return contactService.listContacts(page, limit, keyword, status);
  }

  @PatchMapping("/contacts/{id}/read")
  public Contact markContactRead(@PathVariable String id) {
    return contactService.markAsRead(id);
  }

  @GetMapping("/about-page")
  public AboutPageResponse aboutPage() {
    return siteService.getAboutPage();
  }

  @PutMapping("/about-page")
  public AboutPageResponse updateAboutPage(@Valid @RequestBody AboutPageUpdateRequest request) {
    return siteService.updateAboutPage(request);
  }

  @GetMapping("/about-timeline")
  public List<AboutTimelineEntryResponse> aboutTimeline() {
    return siteService.getAboutTimeline();
  }

  @PostMapping("/about-timeline")
  @ResponseStatus(HttpStatus.CREATED)
  public AboutTimelineEntryResponse createTimelineEntry(@Valid @RequestBody AboutTimelineEntryRequest request) {
    return siteService.createAboutTimelineEntry(request);
  }

  @PutMapping("/about-timeline/{id}")
  public AboutTimelineEntryResponse updateTimelineEntry(@PathVariable String id, @Valid @RequestBody AboutTimelineEntryRequest request) {
    return siteService.updateAboutTimelineEntry(id, request);
  }

  @DeleteMapping("/about-timeline/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTimelineEntry(@PathVariable String id) {
    siteService.deleteAboutTimelineEntry(id);
  }

  @GetMapping("/team")
  public List<TeamMember> teamMembers() {
    return siteService.getAdminTeamMembers();
  }

  @PostMapping("/team")
  @ResponseStatus(HttpStatus.CREATED)
  public TeamMember createTeamMember(@Valid @RequestBody TeamMemberRequest request) {
    return siteService.createTeamMember(request);
  }

  @PutMapping("/team/{id}")
  public TeamMember updateTeamMember(@PathVariable String id, @Valid @RequestBody TeamMemberRequest request) {
    return siteService.updateTeamMember(id, request);
  }

  @DeleteMapping("/team/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTeamMember(@PathVariable String id) {
    siteService.deleteTeamMember(id);
  }
}
