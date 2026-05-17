import { Alert, Button, Tag } from "antd";
import type { RefObject } from "react";
import type { SystemStatus } from "@/types";
import type { RiskActionKey } from "./types";

type Props = {
  status: SystemStatus;
  uploadSectionRef: RefObject<HTMLDivElement | null>;
  securitySectionRef: RefObject<HTMLDivElement | null>;
  formatDateTime: (value?: string) => string;
  formatServiceName: (value?: string) => string;
  onRiskAction: (actionKey?: RiskActionKey) => void;
};

export function SystemSecurityTab({
  status,
  uploadSectionRef,
  securitySectionRef,
  formatDateTime,
  formatServiceName,
  onRiskAction,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-eyebrow">服务状态</p>
              <h3 className="admin-section-title mt-2 text-xl">运行状态</h3>
            </div>
            <Tag color={status.databaseConnected ? "green" : "red"}>{status.databaseConnected ? "正常" : "异常"}</Tag>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">当前服务</p>
              <p className="mt-2 text-muted">{formatServiceName(status.service)}</p>
              {status.service ? <p className="mt-2 break-all text-xs text-muted">{status.service}</p> : null}
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">部署信息</p>
              <p className="mt-2 text-muted">环境：{status.deploymentEnvironment || "未识别环境"}</p>
              <p className="mt-2 break-all text-muted">提交：{status.gitRevision || "未写入构建提交号"}</p>
              <p className="mt-2 text-muted">构建时间：{formatDateTime(status.buildTime)}</p>
              <p className="mt-2 text-muted">部署时间：{formatDateTime(status.deployedAt)}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#1b281e]">交付初始化</p>
                <Tag color={status.deliveryInitialized ? "green" : "gold"}>
                  {status.deliveryInitialized ? "已完成" : "待完成"}
                </Tag>
              </div>
              <p className="mt-2 text-muted">
                {status.requirePasswordChange ? "当前仍在使用初始管理员密码，需先完成改密。" : "管理员密码已完成初始化，可继续正式运营。"}
              </p>
              <p className="mt-2 text-muted">最近改密时间：{formatDateTime(status.adminPasswordChangedAt)}</p>
              {status.requirePasswordChange ? (
                <Button className="mt-3" size="small" onClick={() => onRiskAction("change-password")}>
                  立即修改密码
                </Button>
              ) : null}
            </div>
            <div className="admin-subpanel px-4 py-4" ref={securitySectionRef}>
              <div className="flex items-center justify-between gap-4">
                <p className="font-semibold text-[#1b281e]">安全状态</p>
                <Tag color={status.security?.securityLevel === "good" ? "green" : status.security?.securityLevel === "warning" ? "gold" : "red"}>
                  {status.security?.securityLevel === "good" ? "良好" : status.security?.securityLevel === "warning" ? "待完善" : "高风险"}
                </Tag>
              </div>
              <p className="mt-2 text-muted">{status.security?.securitySummary || "暂未获取安全状态摘要"}</p>
              <p className="mt-2 text-muted">管理员密码：{status.security?.adminPasswordInitialized ? "已初始化" : "仍需初始化"}</p>
              <p className="mt-2 text-muted">JWT 密钥：{status.security?.jwtSecretCustomized ? "已替换默认值" : "仍为默认值"}</p>
              <p className="mt-2 text-muted">数据加密密钥：{status.security?.dataEncryptionKeyCustomized ? "已替换默认值" : "仍为默认值"}</p>
              <p className="mt-2 text-muted">AI 密钥存储：{status.security?.aiKeyEncryptedAtRest ? "已加密存储" : "未加密存储"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">数据库连接</p>
              <p className="mt-2 text-muted">{status.databaseConnected ? "已连接" : "连接失败"}</p>
              <p className="mt-2 text-muted">数据库版本：{status.databaseVersion || "未读取到版本信息"}</p>
              <p className="mt-2 text-muted">数据库容量：{status.databaseSize || "未读取到容量信息"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4" ref={uploadSectionRef}>
              <p className="font-semibold text-[#1b281e]">上传目录</p>
              <p className="mt-2 break-all text-muted">{status.uploadDirectoryPath}</p>
              <p className="mt-2 text-muted">{status.uploadDirectoryReady ? "目录存在且可写" : "目录不可写或不存在"}</p>
              <p className="mt-2 text-muted">目录容量：{status.uploadDirectorySize || "暂未统计到目录容量"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">服务运行时长</p>
              <p className="mt-2 text-muted">{status.uptimeLabel || "暂未记录服务运行时长"}</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="font-semibold text-[#1b281e]">磁盘占用</p>
              <p className="mt-2 text-muted">总容量：{status.diskTotal || "暂未读取到总容量"}</p>
              <p className="mt-2 text-muted">可用容量：{status.diskUsable || "暂未读取到可用容量"}</p>
              <p className="mt-2 text-muted">已用比例：{status.diskUsageRate || "暂未计算已用比例"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">并发防护</p>
                <h3 className="admin-section-title mt-2 text-xl">流量保护状态</h3>
              </div>
              <Tag color={status.protection?.enabled ? "green" : "default"}>
                {status.protection?.enabled ? "已启用" : "未启用"}
              </Tag>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">基础限流阈值</p>
                <p className="mt-2 text-muted">公开读取：{status.protection?.publicReadCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">公开写入：{status.protection?.publicWriteCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">后台接口：{status.protection?.adminCapacity ?? 0} / 周期</p>
                <p className="mt-2 text-muted">高成本接口：{status.protection?.heavyCapacity ?? 0} / 周期</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">并发隔离阈值</p>
                <p className="mt-2 text-muted">AI 任务：{status.protection?.aiMaxConcurrent ?? 0} 并发</p>
                <p className="mt-2 text-muted">上传任务：{status.protection?.uploadMaxConcurrent ?? 0} 并发</p>
                <p className="mt-2 text-muted">配置导入：{status.protection?.configImportMaxConcurrent ?? 0} 并发</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">已触发限流</p>
                <p className="mt-2 text-muted">{status.protection?.rateLimitedCount ?? 0} 次</p>
                <p className="mt-2 text-sm leading-6 text-muted">代表入口限流已经拒绝过部分请求，可用来判断是否需要调大阈值或加前置网关。</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">已触发繁忙拒绝</p>
                <p className="mt-2 text-muted">{status.protection?.busyRejectedCount ?? 0} 次</p>
                <p className="mt-2 text-sm leading-6 text-muted">代表 AI、生图上传或配置导入等重接口因并发保护被拒绝过，可据此评估后续扩容需求。</p>
              </div>
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">AI 状态</p>
                <h3 className="admin-section-title mt-2 text-xl">AI 运行配置</h3>
              </div>
              <Tag color={status.aiEnabled ? "green" : "default"}>{status.aiEnabled ? "已启用" : "未启用"}</Tag>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">提供商</p>
                <p className="mt-2 text-muted">{status.aiProvider || "未配置"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">生图模型</p>
                <p className="mt-2 text-muted">{status.aiImageModel || "未配置"}</p>
              </div>
              <div className="admin-subpanel px-4 py-4">
                <p className="font-semibold text-[#1b281e]">文本模型</p>
                <p className="mt-2 text-muted">{status.aiTextModel || "未配置"}</p>
              </div>
              <Alert
                type={status.aiKeyConfigured ? "success" : "warning"}
                showIcon
                message={status.aiKeyConfigured ? "AI 密钥已配置" : "AI 密钥未配置"}
                action={
                  !status.aiKeyConfigured ? (
                    <Button size="small" onClick={() => onRiskAction("ai-settings")}>
                      前往 AI 配置
                    </Button>
                  ) : undefined
                }
              />
            </div>
          </div>

          <div className="admin-panel admin-shell-card sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-eyebrow">命令边界</p>
                <h3 className="admin-section-title mt-2 text-xl">部署与升级参考</h3>
              </div>
              <Tag color="blue">只读参考</Tag>
            </div>
            <div className="mt-5 space-y-4 text-sm">
              <Alert
                showIcon
                type="info"
                message="部署、升级、回滚仍建议通过命令行执行"
                description="运维中心主要负责状态查看、低风险动作和结果留档。涉及重建容器、切换版本、回滚备份等高风险链路，当前仍建议通过统一命令入口 ./ops.sh 在 Linux / Docker 环境中执行。"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="admin-subpanel px-4 py-4">
                  <p className="font-semibold text-[#1b281e]">源码模式建议命令</p>
                  <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f7f8f5] p-3 text-xs text-[#1b281e]">
{`./ops.sh deploy
./ops.sh upgrade
./ops.sh rollback --latest --dry-run`}
                  </pre>
                </div>
                <div className="admin-subpanel px-4 py-4">
                  <p className="font-semibold text-[#1b281e]">Release 模式建议命令</p>
                  <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f7f8f5] p-3 text-xs text-[#1b281e]">
{`./ops.sh release install
./ops.sh release upgrade
./ops.sh release rollback --latest-previous
./ops.sh release inspect`}
                  </pre>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="admin-subpanel px-4 py-4">
                  <p className="font-semibold text-[#1b281e]">当前版本参考</p>
                  <p className="mt-2 text-muted">环境：{status.deploymentEnvironment || "未识别环境"}</p>
                  <p className="mt-2 break-all text-muted">提交：{status.gitRevision || "未写入构建提交号"}</p>
                  <p className="mt-2 text-muted">构建时间：{formatDateTime(status.buildTime)}</p>
                  <p className="mt-2 text-muted">部署时间：{formatDateTime(status.deployedAt)}</p>
                </div>
                <div className="admin-subpanel px-4 py-4">
                  <p className="font-semibold text-[#1b281e]">执行边界说明</p>
                  <p className="mt-2 text-muted">后台适合执行：备份、巡检、归档、配置导入导出。</p>
                  <p className="mt-2 text-muted">命令行适合执行：部署、升级、回滚、release 切换、镜像构建与环境补齐。</p>
                  <p className="mt-2 text-muted">如需长期运维留档，建议在执行命令后回到本页确认版本号、部署时间和风险状态。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
