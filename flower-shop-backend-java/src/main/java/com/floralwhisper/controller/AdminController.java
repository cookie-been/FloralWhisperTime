package com.floralwhisper.controller;

import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final AuthService authService;
  private final ContactService contactService;

  public AdminController(AuthService authService, ContactService contactService) {
    this.authService = authService;
    this.contactService = contactService;
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
}
