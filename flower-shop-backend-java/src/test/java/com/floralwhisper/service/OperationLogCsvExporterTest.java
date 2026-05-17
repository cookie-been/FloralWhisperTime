package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.floralwhisper.entity.OperationLog;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class OperationLogCsvExporterTest {

  private final OperationLogCsvExporter exporter = new OperationLogCsvExporter();

  @Test
  void exportIncludesBomHeaderAndEscapedFields() {
    OperationLog item = new OperationLog();
    item.setId(7L);
    item.setModule("FLOWER");
    item.setAction("UPDATE");
    item.setTargetType("FLOWER");
    item.setTargetId("flower_007");
    item.setOperatorName("admin");
    item.setSuccess(true);
    item.setRequestSummary("{\"name\":\"晨光\\\"花束\"}");
    item.setErrorMessage("");
    item.setIpAddress("127.0.0.1");
    item.setRestoredFromLogId(3L);
    item.setCreatedAt(LocalDateTime.of(2026, 5, 17, 12, 0, 0));

    String csv = exporter.export(List.of(item));

    assertTrue(csv.startsWith("\uFEFFID,模块,动作,目标类型,目标ID,操作人,结果,请求摘要,失败原因,IP,恢复来源日志ID,创建时间\n"));
    assertTrue(csv.contains("\"SUCCESS\""));
    assertTrue(csv.contains("\"{\"\"name\"\":\"\"晨光\\\"\"花束\"\"}\""));
    assertTrue(csv.contains("\"127.0.0.1\""));
  }

  @Test
  void exportHandlesNullValuesAsEmptyColumns() {
    OperationLog item = new OperationLog();

    String csv = exporter.export(List.of(item));

    String[] lines = csv.split("\n");
    assertEquals(2, lines.length);
    assertEquals("\"\",\"\",\"\",\"\",\"\",\"\",\"FAILED\",\"\",\"\",\"\",\"\",\"\"", lines[1]);
  }
}
