package com.floralwhisper.controller;

import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutPageUpdateRequest;
import com.floralwhisper.dto.AboutTimelineEntryRequest;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AdminBackupFileListResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.AiSettingsUpdateRequest;
import com.floralwhisper.dto.AdminPasswordChangeRequest;
import com.floralwhisper.dto.AdminPasswordChangeResponse;
import com.floralwhisper.dto.AdminSessionResponse;
import com.floralwhisper.dto.AdminOpsTaskListResponse;
import com.floralwhisper.dto.AdminOpsTaskResponse;
import com.floralwhisper.dto.ConfigImportResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.dto.OperationLogArchiveFileResponse;
import com.floralwhisper.dto.OperationLogArchiveResponse;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.dto.OperationLogRestoreRequest;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.dto.TeamMemberRequest;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.protection.HeavyOperationGuard;
import com.floralwhisper.service.OperationLogQueryService;
import com.floralwhisper.service.OperationLogRecoveryService;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import com.floralwhisper.service.AdminOpsTaskService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestPart;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final AuthService authService;
  private final ContactService contactService;
  private final SiteService siteService;
  private final AdminOpsTaskService adminOpsTaskService;
  private final OperationLogQueryService operationLogQueryService;
  private final OperationLogRecoveryService operationLogRecoveryService;
  private final HeavyOperationGuard heavyOperationGuard;

  public AdminController(
      AuthService authService,
      ContactService contactService,
      SiteService siteService,
      AdminOpsTaskService adminOpsTaskService,
      OperationLogQueryService operationLogQueryService,
      OperationLogRecoveryService operationLogRecoveryService,
      HeavyOperationGuard heavyOperationGuard) {
    this.authService = authService;
    this.contactService = contactService;
    this.siteService = siteService;
    this.adminOpsTaskService = adminOpsTaskService;
    this.operationLogQueryService = operationLogQueryService;
    this.operationLogRecoveryService = operationLogRecoveryService;
    this.heavyOperationGuard = heavyOperationGuard;
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @GetMapping("/me")
  public AdminSessionResponse me() {
    return authService.currentAdmin();
  }

  @PostMapping("/change-password")
  public AdminPasswordChangeResponse changePassword(Principal principal, @Valid @RequestBody AdminPasswordChangeRequest request) {
    String username = principal == null ? "" : principal.getName();
    return authService.changePassword(username, request);
  }

  @GetMapping("/system/status")
  public SystemStatusResponse systemStatus() {
    return siteService.getSystemStatus();
  }

  @GetMapping("/system/ops-tasks")
  public AdminOpsTaskListResponse opsTasks() {
    return adminOpsTaskService.listRecentTasks();
  }

  @GetMapping("/system/backups")
  public AdminBackupFileListResponse backups() {
    return siteService.listBackupFiles();
  }

  @PostMapping("/system/ops-tasks/backup")
  public AdminOpsTaskResponse createBackupTask(Principal principal) {
    String username = principal == null ? "" : principal.getName();
    return adminOpsTaskService.createBackupTask(username);
  }

  @PostMapping("/system/ops-tasks/inspection")
  public AdminOpsTaskResponse createInspectionTask(Principal principal) {
    String username = principal == null ? "" : principal.getName();
    return adminOpsTaskService.createInspectionTask(username);
  }

  @GetMapping("/site-config")
  public SiteConfigResponse siteConfig() {
    return siteService.getAdminSiteConfig();
  }

  @GetMapping(value = "/system/backups/latest/download", produces = "application/gzip")
  public void downloadLatestBackup(HttpServletResponse response) throws java.io.IOException {
    String filename = "latest-backup.tar.gz";
    response.setContentType("application/gzip");
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
    siteService.writeLatestBackupArchive(response.getOutputStream());
  }

  @GetMapping(value = "/system/backups/{backupName}/download", produces = "application/gzip")
  public void downloadBackup(@PathVariable String backupName, HttpServletResponse response) throws java.io.IOException {
    String filename = backupName + ".tar.gz";
    response.setContentType("application/gzip");
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
    siteService.writeBackupArchive(backupName, response.getOutputStream());
  }

  @GetMapping(value = "/system/config-export", produces = "application/json")
  public void downloadConfigExport(HttpServletResponse response) throws java.io.IOException {
    String filename = siteService.writeConfigExport(response.getOutputStream());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
  }

  @PostMapping(value = "/system/config-import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ConfigImportResponse importConfig(@RequestPart("file") MultipartFile file) throws java.io.IOException {
    try (HeavyOperationGuard.Permit ignored = heavyOperationGuard.acquireConfigImportPermit()) {
      return siteService.importConfig(file);
    }
  }

  @PostMapping("/system/operation-logs/archive")
  public OperationLogArchiveResponse archiveOperationLogs(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime before) {
    return siteService.archiveOperationLogs(before);
  }

  @GetMapping("/system/operation-logs/archive-files")
  public List<OperationLogArchiveFileResponse> operationLogArchiveFiles() {
    return siteService.listOperationLogArchiveFiles();
  }

  @GetMapping(value = "/system/operation-logs/archive-files/{filename}/download", produces = "text/csv;charset=UTF-8")
  public void downloadOperationLogArchiveFile(@PathVariable String filename, HttpServletResponse response) throws java.io.IOException {
    response.setContentType("text/csv;charset=UTF-8");
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
    siteService.writeOperationLogArchiveFile(filename, response.getOutputStream());
  }

  @GetMapping("/system/ai-settings")
  public AiSettingsResponse aiSettings() {
    return siteService.getAdminAiSettings();
  }

  @PutMapping("/system/ai-settings")
  public AiSettingsResponse updateAiSettings(@Valid @RequestBody AiSettingsUpdateRequest request) {
    return siteService.updateAdminAiSettings(request);
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

  @GetMapping("/operation-logs")
  public PaginatedResult<OperationLogResponse> operationLogs(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer limit,
      @RequestParam(required = false) String module,
      @RequestParam(required = false) String action,
      @RequestParam(required = false) String operatorName,
      @RequestParam(required = false) Boolean success,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) Boolean restorable,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdTo) {
    return operationLogQueryService.list(
        page, limit, module, action, operatorName, success, keyword, restorable, createdFrom, createdTo);
  }

  @GetMapping(value = "/operation-logs/export", produces = "text/csv;charset=UTF-8")
  public void exportOperationLogs(
      @RequestParam(required = false) String module,
      @RequestParam(required = false) String action,
      @RequestParam(required = false) String operatorName,
      @RequestParam(required = false) Boolean success,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) Boolean restorable,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdTo,
      HttpServletResponse response) throws java.io.IOException {
    response.setContentType("text/csv;charset=UTF-8");
    response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"operation-logs.csv\"");
    response.getWriter().write(buildOperationLogCsv(operationLogQueryService.listForExport(
        module, action, operatorName, success, keyword, restorable, createdFrom, createdTo)));
  }

  @GetMapping("/operation-logs/{id}")
  public OperationLogDetailResponse operationLogDetail(@PathVariable Long id) {
    return operationLogQueryService.getDetail(id);
  }

  @PostMapping("/operation-logs/{id}/restore")
  public OperationLogDetailResponse restoreOperationLog(@PathVariable Long id, @Valid @RequestBody OperationLogRestoreRequest request) {
    return operationLogRecoveryService.restore(id, request == null ? "" : request.getReason());
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

  private String buildOperationLogCsv(List<OperationLogResponse> logs) {
    StringBuilder builder = new StringBuilder("\uFEFF");
    builder
        .append("ID,模块,动作,目标类型,目标ID,操作人,结果,请求摘要,失败原因,IP,恢复来源日志ID,可恢复,创建时间\n");
    for (OperationLogResponse item : logs) {
      builder
          .append(csv(item.getId()))
          .append(',').append(csv(item.getModule()))
          .append(',').append(csv(item.getAction()))
          .append(',').append(csv(item.getTargetType()))
          .append(',').append(csv(item.getTargetId()))
          .append(',').append(csv(item.getOperatorName()))
          .append(',').append(csv(Boolean.TRUE.equals(item.getSuccess()) ? "SUCCESS" : "FAILED"))
          .append(',').append(csv(item.getRequestSummary()))
          .append(',').append(csv(item.getErrorMessage()))
          .append(',').append(csv(item.getIpAddress()))
          .append(',').append(csv(item.getRestoredFromLogId()))
          .append(',').append(csv(item.getRestorable()))
          .append(',').append(csv(item.getCreatedAt()))
          .append('\n');
    }
    return builder.toString();
  }

  private String csv(Object value) {
    if (value == null) {
      return "\"\"";
    }
    String raw = String.valueOf(value).replace("\"", "\"\"");
    return "\"" + raw + "\"";
  }
}
