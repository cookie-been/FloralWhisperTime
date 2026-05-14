package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.info.BuildProperties;

class SiteServiceTest {

  @TempDir
  Path tempDir;

  @Test
  void systemStatusReturnsResolvedRuntimeState() throws Exception {
    Path uploadsDir = Files.createDirectories(tempDir.resolve("uploads"));
    Files.writeString(uploadsDir.resolve("hero.jpg"), "demo");

    Path backupsDir = Files.createDirectories(tempDir.resolve("backups"));
    Files.createDirectories(backupsDir.resolve("20260515-002808"));
    Files.createDirectories(backupsDir.resolve("20260515-010101"));

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(true, "volcengine", "secret-key", "doubao-image", "doubao-text"));

    DataSource dataSource = mock(DataSource.class);
    Connection connection = mock(Connection.class);
    when(dataSource.getConnection()).thenReturn(connection);
    when(connection.isValid(2)).thenReturn(true);

    BuildProperties buildProperties = new BuildProperties(new java.util.Properties() {{
      put("group", "com.floralwhisper");
      put("artifact", "flower-shop-backend-java");
      put("name", "flower-shop-backend-java");
      put("version", "1.2.3");
      put("time", "2026-05-15T00:00:00Z");
    }});

    SiteService siteService =
        new SiteService(
            mock(SiteConfigMapper.class),
            mock(SiteConfigStatMapper.class),
            mock(ShopInfoMapper.class),
            mock(ShopHourMapper.class),
            mock(AboutPageMapper.class),
            mock(AboutTimelineEntryMapper.class),
            aiSettingsMapper,
            mock(BrandStoryMapper.class),
            mock(BrandStoryImageMapper.class),
            mock(CategoryMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            buildProperties);

    SystemStatusResponse response = siteService.getSystemStatus();

    assertEquals("flower-shop-backend-java", response.getService());
    assertEquals("1.2.3", response.getVersion());
    assertTrue(response.isDatabaseConnected());
    assertTrue(response.isUploadDirectoryReady());
    assertEquals(1L, response.getUploadFileCount());
    assertEquals(uploadsDir.toFile().getAbsolutePath(), response.getUploadDirectoryPath());
    assertTrue(response.isAiEnabled());
    assertTrue(response.isAiKeyConfigured());
    assertEquals("volcengine", response.getAiProvider());
    assertEquals("doubao-image", response.getAiImageModel());
    assertEquals("doubao-text", response.getAiTextModel());
    assertTrue(response.isLatestBackupPresent());
    assertEquals("20260515-010101", response.getLatestBackupName());
    assertEquals(backupsDir.resolve("20260515-010101").toFile().getAbsolutePath(), response.getLatestBackupPath());
  }

  @Test
  void systemStatusHandlesUnavailableDatabaseAndMissingBackupDirectory() throws Exception {
    Path uploadsDir = tempDir.resolve("missing-uploads");
    Path backupsDir = tempDir.resolve("missing-backups");

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(false, "volcengine", "", "doubao-image", "doubao-text"));

    DataSource dataSource = mock(DataSource.class);
    when(dataSource.getConnection()).thenThrow(new SQLException("down"));

    SiteService siteService =
        new SiteService(
            mock(SiteConfigMapper.class),
            mock(SiteConfigStatMapper.class),
            mock(ShopInfoMapper.class),
            mock(ShopHourMapper.class),
            mock(AboutPageMapper.class),
            mock(AboutTimelineEntryMapper.class),
            aiSettingsMapper,
            mock(BrandStoryMapper.class),
            mock(BrandStoryImageMapper.class),
            mock(CategoryMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            null);

    SystemStatusResponse response = siteService.getSystemStatus();

    assertFalse(response.isDatabaseConnected());
    assertFalse(response.isUploadDirectoryReady());
    assertEquals(0L, response.getUploadFileCount());
    assertFalse(response.isAiEnabled());
    assertFalse(response.isAiKeyConfigured());
    assertFalse(response.isLatestBackupPresent());
    assertEquals("", response.getLatestBackupName());
    assertEquals("", response.getLatestBackupPath());
  }

  private AppProperties appProperties(Path uploadsDir, Path backupsDir) {
    AppProperties properties = new AppProperties();
    AppProperties.Upload upload = new AppProperties.Upload();
    upload.setDir(uploadsDir.toString());
    properties.setUpload(upload);
    AppProperties.Backup backup = new AppProperties.Backup();
    backup.setDir(backupsDir.toString());
    properties.setBackup(backup);
    return properties;
  }

  private AiSettings aiSettings(boolean enabled, String provider, String apiKey, String imageModel, String textModel) {
    AiSettings settings = new AiSettings();
    settings.setId(1L);
    settings.setEnabled(enabled);
    settings.setProvider(provider);
    settings.setApiKey(apiKey);
    settings.setModel(imageModel);
    settings.setTextModel(textModel);
    return settings;
  }
}
