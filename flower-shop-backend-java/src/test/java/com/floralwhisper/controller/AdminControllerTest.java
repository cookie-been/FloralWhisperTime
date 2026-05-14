package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.entity.Contact;
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
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.security.JwtAuthenticationFilter;
import com.floralwhisper.security.JwtService;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class, AdminControllerTest.TestConfig.class})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java"
})
class AdminControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private AppProperties properties;

  @MockBean
  private AuthService authService;
  @MockBean
  private ContactService contactService;
  @MockBean private BrandStoryImageMapper brandStoryImageMapper;
  @MockBean private BrandStoryMapper brandStoryMapper;
  @MockBean private CategoryMapper categoryMapper;
  @MockBean private ContactMapper contactMapper;
  @MockBean private FlowerImageMapper flowerImageMapper;
  @MockBean private FlowerMapper flowerMapper;
  @MockBean private FlowerMaterialMapper flowerMaterialMapper;
  @MockBean private FlowerTagMapper flowerTagMapper;
  @MockBean private ShopHourMapper shopHourMapper;
  @MockBean private ShopInfoMapper shopInfoMapper;
  @MockBean private SiteConfigMapper siteConfigMapper;
  @MockBean private SiteConfigStatMapper siteConfigStatMapper;
  @MockBean private TeamMemberMapper teamMemberMapper;

  @Test
  void loginReturnsTokenAndUsername() throws Exception {
    when(authService.login(any())).thenReturn(new LoginResponse("jwt-token", "admin"));

    mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"admin","password":"Floral@2026"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("jwt-token"))
        .andExpect(jsonPath("$.username").value("admin"));
  }

  @Test
  void loginRejectsBlankUsernameWithMessageShape() throws Exception {
    mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"","password":"Floral@2026"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请输入账号"));
  }

  @Test
  void meRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void meRejectsExpiredTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + expiredToken()))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("登录状态已过期，请重新登录"));
  }

  @Test
  void meReturnsCurrentAdminWhenTokenIsValid() throws Exception {
    when(authService.currentAdmin()).thenReturn(Map.of("username", "admin"));

    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"));
  }

  @Test
  void contactsRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/contacts"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void contactsReturnsPaginatedListWhenTokenIsValid() throws Exception {
    Contact contact = new Contact();
    contact.setId("contact_001");
    contact.setName("林小姐");
    contact.setPhone("13800138000");
    contact.setMessage("想预约母亲节花束");
    contact.setCreatedAt(LocalDateTime.of(2026, 5, 14, 11, 30));
    contact.setReadAt(LocalDateTime.of(2026, 5, 14, 12, 0));

    when(contactService.listContacts(2, 10, "母亲节", "read")).thenReturn(new PaginatedResult<>(List.of(contact), 1, 2, 10));

    mockMvc.perform(get("/api/admin/contacts")
            .param("page", "2")
            .param("limit", "10")
            .param("keyword", "母亲节")
            .param("status", "read")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.list[0].id").value("contact_001"))
        .andExpect(jsonPath("$.list[0].name").value("林小姐"))
        .andExpect(jsonPath("$.list[0].phone").value("13800138000"))
        .andExpect(jsonPath("$.list[0].message").value("想预约母亲节花束"))
        .andExpect(jsonPath("$.list[0].readAt").value("2026-05-14T12:00:00"))
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.page").value(2))
        .andExpect(jsonPath("$.limit").value(10));
  }

  @Test
  void markContactReadRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(patch("/api/admin/contacts/contact_001/read"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void markContactReadReturnsUpdatedContactWhenTokenIsValid() throws Exception {
    Contact updated = new Contact();
    updated.setId("contact_001");
    updated.setName("林小姐");
    updated.setPhone("13800138000");
    updated.setMessage("想预约母亲节花束");
    updated.setCreatedAt(LocalDateTime.of(2026, 5, 14, 11, 30));
    updated.setReadAt(LocalDateTime.of(2026, 5, 14, 12, 10));

    when(contactService.markAsRead(eq("contact_001"))).thenReturn(updated);

    mockMvc.perform(patch("/api/admin/contacts/contact_001/read")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("contact_001"))
        .andExpect(jsonPath("$.readAt").value("2026-05-14T12:10:00"));
  }

  private String expiredToken() {
    return Jwts.builder()
        .issuer(properties.getJwt().getIssuer())
        .subject(properties.getAdmin().getUsername())
        .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
        .expiration(Date.from(Instant.now().minusSeconds(60)))
        .signWith(secretKey())
        .compact();
  }

  private SecretKey secretKey() {
    byte[] bytes = properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(bytes.length >= 32 ? bytes : (properties.getJwt().getSecret() + "00000000000000000000000000000000").getBytes(StandardCharsets.UTF_8));
  }

  @TestConfiguration
  @EnableConfigurationProperties(AppProperties.class)
  static class TestConfig {}
}
