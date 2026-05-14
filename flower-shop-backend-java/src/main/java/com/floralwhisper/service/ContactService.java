package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
  private final ContactMapper contactMapper;

  public ContactService(ContactMapper contactMapper) {
    this.contactMapper = contactMapper;
  }

  public Map<String, Boolean> create(ContactRequest request) {
    Contact contact = new Contact();
    contact.setId("contact_" + System.currentTimeMillis());
    contact.setName(request.getName().trim());
    contact.setPhone(request.getPhone().trim());
    contact.setMessage(request.getMessage().trim());
    contact.setCreatedAt(LocalDateTime.now());
    contactMapper.insert(contact);
    return Map.of("success", true);
  }

  public PaginatedResult<Contact> listContacts(Integer page, Integer limit, String keyword, String status) {
    int currentPage = page == null || page < 1 ? 1 : page;
    int pageSize = limit == null || limit < 1 ? 20 : limit;
    String normalizedKeyword = keyword == null ? "" : keyword.trim();
    String normalizedStatus = status == null || status.isBlank() ? "all" : status.trim().toLowerCase();

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

    java.util.List<Contact> contacts = contactMapper.selectList(query);
    int from = Math.min((currentPage - 1) * pageSize, contacts.size());
    int to = Math.min(from + pageSize, contacts.size());
    return new PaginatedResult<>(contacts.subList(from, to), contacts.size(), currentPage, pageSize);
  }

  @Transactional
  public Contact markAsRead(String id) {
    Contact contact = contactMapper.selectById(id);
    if (contact == null) throw new ApiException(HttpStatus.NOT_FOUND, "留言不存在");
    if (contact.getReadAt() == null) {
      contact.setReadAt(LocalDateTime.now());
      contactMapper.updateById(contact);
    }
    return contact;
  }
}
