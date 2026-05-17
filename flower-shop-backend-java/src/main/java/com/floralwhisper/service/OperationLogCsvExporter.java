package com.floralwhisper.service;

import com.floralwhisper.entity.OperationLog;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OperationLogCsvExporter {

  public String export(List<OperationLog> logs) {
    StringBuilder builder = new StringBuilder("\uFEFF");
    builder.append("ID,模块,动作,目标类型,目标ID,操作人,结果,请求摘要,失败原因,IP,恢复来源日志ID,创建时间\n");
    if (logs == null || logs.isEmpty()) {
      return builder.toString();
    }
    for (OperationLog item : logs) {
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
