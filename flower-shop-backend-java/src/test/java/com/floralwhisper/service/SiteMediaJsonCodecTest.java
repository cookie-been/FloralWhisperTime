package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

class SiteMediaJsonCodecTest {

  private final SiteMediaJsonCodec codec = new SiteMediaJsonCodec(new ObjectMapper());

  @Test
  void readNormalizesBlankAndDuplicateItems() {
    List<String> result = codec.read("[\" /a.jpg \",\"/a.jpg\",\"\",\"/b.jpg\"]");

    assertEquals(List.of("/a.jpg", "/b.jpg"), result);
  }

  @Test
  void readReturnsEmptyListWhenPayloadIsInvalid() {
    Logger logger = (Logger) LoggerFactory.getLogger(SiteMediaJsonCodec.class);
    Level originalLevel = logger.getLevel();
    List<String> result;
    logger.setLevel(Level.ERROR);
    try {
      result = codec.read("{invalid");
    } finally {
      logger.setLevel(originalLevel);
    }

    assertEquals(List.of(), result);
  }

  @Test
  void writeNormalizesBlankAndDuplicateItems() {
    String result = codec.write(List.of(" /a.jpg ", "/a.jpg", "", "/b.jpg"));

    assertEquals("[\"/a.jpg\",\"/b.jpg\"]", result);
  }

  @Test
  void writeReturnsEmptyJsonArrayWhenInputIsNull() {
    String result = codec.write(null);

    assertEquals("[]", result);
  }
}
