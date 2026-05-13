package com.floralwhisper.service;

import com.floralwhisper.dto.ContactRequest;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.mapper.ContactMapper;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.stereotype.Service;

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
}
