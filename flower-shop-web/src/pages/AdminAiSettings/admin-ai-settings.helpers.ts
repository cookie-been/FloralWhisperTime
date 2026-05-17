export function buildAdminAiSummaryText(options: {
  provider: string;
  model: string;
  size: string;
  textModel: string;
}) {
  return `当前提供商：${options.provider || "未配置"}；生图模型：${options.model || "未配置"}；文本模型：${options.textModel || "未配置"}；当前尺寸：${options.size || "未配置"}。`;
}

export function buildAdminAiAdviceList() {
  return [
    "建议正式环境和测试环境使用不同 API Key，避免调试内容混入生产资产。",
    "修改模型、接口地址、尺寸与文本模型后会立即生效，适合后续接入新模型或切换不同的生成策略。",
  ];
}
