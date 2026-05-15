package com.floralwhisper.migration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.Flower;
import com.floralwhisper.entity.FlowerImage;
import com.floralwhisper.entity.FlowerMaterial;
import com.floralwhisper.entity.FlowerTag;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.TeamMember;
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
import com.floralwhisper.mapper.TeamMemberMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(MockitoExtension.class)
class JsonImportServiceTest {
  @Mock
  private CategoryMapper categoryMapper;
  @Mock
  private FlowerMapper flowerMapper;
  @Mock
  private FlowerImageMapper flowerImageMapper;
  @Mock
  private FlowerMaterialMapper flowerMaterialMapper;
  @Mock
  private FlowerTagMapper flowerTagMapper;
  @Mock
  private SiteConfigMapper siteConfigMapper;
  @Mock
  private ShopInfoMapper shopInfoMapper;
  @Mock
  private ShopHourMapper shopHourMapper;
  @Mock
  private BrandStoryMapper brandStoryMapper;
  @Mock
  private BrandStoryImageMapper brandStoryImageMapper;
  @Mock
  private TeamMemberMapper teamMemberMapper;
  @Mock
  private ContactMapper contactMapper;

  private JsonImportService jsonImportService;

  @BeforeEach
  void setUp() {
    lenient().when(categoryMapper.selectCount(any())).thenReturn(0L);
    lenient().when(flowerMapper.selectCount(any())).thenReturn(0L);
    lenient().when(teamMemberMapper.selectCount(any())).thenReturn(0L);
    lenient().when(contactMapper.selectCount(any())).thenReturn(0L);
    lenient().when(siteConfigMapper.selectById(1L)).thenReturn(null);
    lenient().when(shopInfoMapper.selectById(1L)).thenReturn(null);
    lenient().when(brandStoryMapper.selectById(1L)).thenReturn(null);
    jsonImportService = new JsonImportService(
        new ObjectMapper(),
        categoryMapper,
        flowerMapper,
        flowerImageMapper,
        flowerMaterialMapper,
        flowerTagMapper,
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        teamMemberMapper,
        contactMapper);
  }

  @Test
  void importsLegacyJsonIntoNormalizedWrites() {
    JsonImportService.ImportSummary summary =
        jsonImportService.importFromJson(Path.of("../flower-shop-backend/data/db.json"), false);

    assertEquals(7, summary.categories());
    assertEquals(4, summary.flowers());
    assertEquals(9, summary.images());
    assertEquals(16, summary.materials());
    assertEquals(13, summary.tags());
    assertEquals(2, summary.storyImages());
    assertEquals(2, summary.teamMembers());
    assertEquals(7, summary.shopHours());
    assertEquals(0, summary.contacts());

    ArgumentCaptor<Flower> flowerCaptor = ArgumentCaptor.forClass(Flower.class);
    verify(flowerMapper, times(4)).insert(flowerCaptor.capture());
    assertEquals("wedding_001", flowerCaptor.getAllValues().get(0).getId());
    verify(categoryMapper, times(7)).insert(any(Category.class));
    verify(flowerImageMapper, times(9)).insert(any(FlowerImage.class));
    verify(flowerMaterialMapper, times(16)).insert(any(FlowerMaterial.class));
    verify(flowerTagMapper, times(13)).insert(any(FlowerTag.class));
    verify(siteConfigMapper, times(1)).insert(any(SiteConfig.class));
    verify(shopInfoMapper, times(1)).insert(any(ShopInfo.class));
    verify(shopHourMapper, times(7)).insert(any(ShopHour.class));
    verify(brandStoryMapper, times(1)).insert(any(BrandStory.class));
    verify(brandStoryImageMapper, times(2)).insert(any(BrandStoryImage.class));
    verify(teamMemberMapper, times(2)).insert(any(TeamMember.class));
    verify(contactMapper, never()).insert(any(Contact.class));
  }

  @Test
  void rejectsMalformedJsonClearly(@TempDir Path tempDir) throws Exception {
    Path brokenFile = tempDir.resolve("broken.json");
    Files.writeString(brokenFile, "{not-valid-json");

    IllegalArgumentException error =
        assertThrows(IllegalArgumentException.class, () -> jsonImportService.importFromJson(brokenFile, false));

    assertTrue(error.getMessage().contains("JSON 导入文件格式不正确"));
  }

  @Test
  void refusesToReimportIntoExistingDatabaseWithoutExplicitReplace() {
    when(categoryMapper.selectCount(any())).thenReturn(1L);

    IllegalStateException error =
        assertThrows(IllegalStateException.class,
            () -> jsonImportService.importFromJson(Path.of("../flower-shop-backend/data/db.json"), false));

    assertTrue(error.getMessage().contains("数据库已存在数据"));
    verify(categoryMapper, never()).insert(any(Category.class));
  }
}
