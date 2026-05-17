package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.ContactRequest;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.mapper.ContactMapper;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {
  private static final String ACTIVE_FILTER = "active";
  private static final String DELETED_FILTER = "deleted";
  private static final String ALL_FILTER = "all";

  private final ContactMapper contactMapper;
  private final AuditLogService auditLogService;

  public ContactService(ContactMapper contactMapper, AuditLogService auditLogService) {
    this.contactMapper = contactMapper;
    this.auditLogService = auditLogService;
  }

  public Map<String, Boolean> create(ContactRequest request) {
    Contact contact = new Contact();
    contact.setId("contact_" + System.currentTimeMillis());
    contact.setName(request.getName().trim());
    contact.setPhone(request.getPhone().trim());
    contact.setMessage(request.getMessage().trim());
    contact.setCreatedAt(LocalDateTime.now());
    contact.setDeleted(0);
    contactMapper.insert(contact);
    return Map.of("success", true);
  }

  public PaginatedResult<Contact> listContacts(Integer page, Integer limit, String keyword, String status) {
    return listContacts(page, limit, keyword, status, ACTIVE_FILTER);
  }

  public PaginatedResult<Contact> listContacts(Integer page, Integer limit, String keyword, String status, String deleted) {
    int currentPage = page == null || page < 1 ? 1 : page;
    int pageSize = limit == null || limit < 1 ? 20 : limit;
    String normalizedKeyword = keyword == null ? "" : keyword.trim();
    String normalizedStatus = status == null || status.isBlank() ? "all" : status.trim().toLowerCase();
    String deletedFilter = normalizeDeletedFilter(deleted);

    LambdaQueryWrapper<Contact> query = new LambdaQueryWrapper<Contact>()
        .and(!normalizedKeyword.isBlank(), wrapper -> wrapper
            .like(Contact::getName, normalizedKeyword)
            .or()
            .like(Contact::getPhone, normalizedKeyword)
            .or()
            .like(Contact::getMessage, normalizedKeyword))
        .isNotNull("read".equals(normalizedStatus), Contact::getReadAt)
        .isNull("unread".equals(normalizedStatus), Contact::getReadAt)
        .orderByDesc(Contact::getCreatedAt)
        .orderByDesc(Contact::getId);
    applyDeletedFilter(query, deletedFilter);

    java.util.List<Contact> contacts = contactMapper.selectList(query);
    int from = Math.min((currentPage - 1) * pageSize, contacts.size());
    int to = Math.min(from + pageSize, contacts.size());
    return new PaginatedResult<>(contacts.subList(from, to), contacts.size(), currentPage, pageSize);
  }

  @Transactional
  public Contact markAsRead(String id) {
    Contact before = null;
    try {
      Contact contact = contactMapper.selectById(id);
      if (contact == null) throw new ApiException(HttpStatus.NOT_FOUND, "留言不存在");
      before = copyContact(contact);
      if (contact.getReadAt() == null) {
        contact.setReadAt(LocalDateTime.now());
        contactMapper.updateById(contact);
      }
      auditLogService.record(AuditLogCommand.builder()
          .module("CONTACT")
          .action("MARK_READ")
          .targetType("CONTACT")
          .targetId(id)
          .beforeSnapshot(before)
          .afterSnapshot(contact)
          .requestSummary(Map.of("contactId", id))
          .success(true)
          .build());
      return contact;
    } catch (RuntimeException error) {
      auditLogService.record(AuditLogCommand.builder()
          .module("CONTACT")
          .action("MARK_READ")
          .targetType("CONTACT")
          .targetId(id)
          .beforeSnapshot(before)
          .requestSummary(Map.of("contactId", id))
          .success(false)
          .errorMessage(error.getMessage())
          .build());
      throw error;
    }
  }

  @Transactional
  public void delete(String id) {
    Contact before = null;
    try {
      Contact contact = contactMapper.selectById(id);
      if (contact == null) throw new ApiException(HttpStatus.NOT_FOUND, "留言不存在");
      before = copyContact(contact);
      contactMapper.deleteById(id);
      auditLogService.record(AuditLogCommand.builder()
          .module("CONTACT")
          .action("DELETE")
          .targetType("CONTACT")
          .targetId(id)
          .beforeSnapshot(before)
          .requestSummary(Map.of("contactId", id))
          .success(true)
          .build());
    } catch (RuntimeException error) {
      auditLogService.record(AuditLogCommand.builder()
          .module("CONTACT")
          .action("DELETE")
          .targetType("CONTACT")
          .targetId(id)
          .beforeSnapshot(before)
          .requestSummary(Map.of("contactId", id))
          .success(false)
          .errorMessage(error.getMessage())
          .build());
      throw error;
    }
  }

  @Transactional
  public Contact restore(String id) {
    Contact current = contactMapper.selectByIdIncludingDeleted(id);
    if (current == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "留言不存在");
    }
    Contact before = copyContact(current);
    if (Integer.valueOf(1).equals(current.getDeleted())) {
      contactMapper.restoreDeletedById(id);
    }
    Contact restored = contactMapper.selectById(id);
    auditLogService.record(AuditLogCommand.builder()
        .module("CONTACT")
        .action("RESTORE")
        .targetType("CONTACT")
        .targetId(id)
        .beforeSnapshot(before)
        .afterSnapshot(copyContact(restored))
        .requestSummary(Map.of("contactId", id))
        .success(true)
        .build());
    return restored;
  }

  private String normalizeDeletedFilter(String deleted) {
    if (deleted == null || deleted.isBlank()) {
      return ACTIVE_FILTER;
    }
    String normalized = deleted.trim().toLowerCase();
    return switch (normalized) {
      case ACTIVE_FILTER, DELETED_FILTER, ALL_FILTER -> normalized;
      default -> ACTIVE_FILTER;
    };
  }

  private void applyDeletedFilter(LambdaQueryWrapper<Contact> query, String deletedFilter) {
    switch (deletedFilter) {
      case DELETED_FILTER -> query.eq(Contact::getDeleted, 1);
      case ALL_FILTER -> {
      }
      default -> query.eq(Contact::getDeleted, 0);
    }
  }

  private Contact copyContact(Contact source) {
    Contact copy = new Contact();
    copy.setId(source.getId());
    copy.setName(source.getName());
    copy.setPhone(source.getPhone());
    copy.setMessage(source.getMessage());
    copy.setCreatedAt(source.getCreatedAt());
    copy.setReadAt(source.getReadAt());
    copy.setDeleted(source.getDeleted());
    return copy;
  }
}
