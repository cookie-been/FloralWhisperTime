import { Alert, Button, Switch, Tag } from "antd";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { AdminOpsTask } from "@/types";
import type { KeyValueEntry, RiskActionKey, RiskItem, SummaryItem } from "./types";

type Props = {
  riskAlertType: "success" | "error" | "warning";
  riskState: {
    title: string;
    message: string;
  };
  lastRefreshError: string;
  autoRefreshPaused: boolean;
  refreshErrorCount: number;
  lastRefreshAt: string;
  autoRefresh: boolean;
  refreshing: boolean;
  onToggleAutoRefresh: (checked: boolean) => void;
  onManualRefresh: () => void;
  summary: SummaryItem[];
  riskItems: RiskItem[];
  latestInspectionTask: AdminOpsTask | null;
  inspectionOverview: KeyValueEntry[];
  onRiskAction: (actionKey?: RiskActionKey) => void;
  onViewTask: (task: AdminOpsTask) => void;
  getTaskStatusMeta: (status?: string) => { color: "green" | "red" | "blue"; label: string };
  formatDateTime: (value?: string) => string;
};

export function SystemOverviewTab({
  riskAlertType,
  riskState,
  lastRefreshError,
  autoRefreshPaused,
  refreshErrorCount,
  lastRefreshAt,
  autoRefresh,
  refreshing,
  onToggleAutoRefresh,
  onManualRefresh,
  summary,
  riskItems,
  latestInspectionTask,
  inspectionOverview,
  onRiskAction,
  onViewTask,
  getTaskStatusMeta,
  formatDateTime,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <section className="admin-panel admin-shell-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 space-y-3">
            <Alert
              showIcon
              type={riskAlertType}
              icon={<AlertTriangle size={16} />}
              message={riskState.title}
              description={riskState.message}
            />
            {lastRefreshError ? (
              <Alert
                showIcon
                type={autoRefreshPaused ? "error" : "warning"}
                message={autoRefreshPaused ? "自动轮询已暂停" : "最近一次刷新失败"}
                description={
                  autoRefreshPaused
                    ? `连续失败 ${refreshErrorCount} 次，已暂停自动轮询。最近错误：${lastRefreshError}`
                    : `连续失败 ${refreshErrorCount} 次。最近错误：${lastRefreshError}`
                }
              />
            ) : null}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span>最近刷新：{lastRefreshAt || "暂无"}</span>
              <span>连续失败：{refreshErrorCount} 次</span>
              <label className="flex items-center gap-2">
                <Switch checked={autoRefresh} onChange={onToggleAutoRefresh} size="small" />
                <span>自动轮询（60秒）{autoRefreshPaused ? " · 已暂停" : ""}</span>
              </label>
            </div>
          </div>
          <Button icon={<RefreshCw size={16} />} loading={refreshing} onClick={onManualRefresh}>
            刷新状态
          </Button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="admin-stat-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-muted">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#1b281e]">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf4eb] text-forest">
                  <Icon size={18} />
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">风险清单</p>
              <h3 className="admin-section-title mt-2 text-xl">当前优先处理项</h3>
            </div>
            <Tag color={riskItems.length ? "red" : "green"}>{riskItems.length ? `${riskItems.length} 项` : "正常"}</Tag>
          </div>
          <div className="mt-5 space-y-3">
            {riskItems.length ? (
              riskItems.map((item) => (
                <Alert
                  key={item.title}
                  showIcon
                  type={item.level}
                  message={`${item.title} · P${item.priority}`}
                  description={
                    <div className="space-y-2">
                      <p>{item.detail}</p>
                      {item.suggestion ? <p className="text-xs text-muted">建议处理：{item.suggestion}</p> : null}
                    </div>
                  }
                  action={
                    item.actionKey && item.actionLabel ? (
                      <Button size="small" onClick={() => onRiskAction(item.actionKey)}>
                        {item.actionLabel}
                      </Button>
                    ) : undefined
                  }
                />
              ))
            ) : (
              <Alert
                showIcon
                type="success"
                message="当前没有高优先级风险项"
                description="数据库、上传目录、备份、AI 密钥与基础安全状态当前均处于可交付范围内。"
              />
            )}
          </div>
        </div>

        <div className="admin-panel admin-shell-card sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-eyebrow">巡检摘要</p>
              <h3 className="admin-section-title mt-2 text-xl">最近一次巡检结论</h3>
            </div>
            <Tag color={latestInspectionTask ? getTaskStatusMeta(latestInspectionTask.status).color : "default"}>
              {latestInspectionTask ? getTaskStatusMeta(latestInspectionTask.status).label : "暂无"}
            </Tag>
          </div>
          {latestInspectionTask ? (
            <div className="mt-5 space-y-4 text-sm">
              <p className="text-muted">
                巡检时间：{formatDateTime(latestInspectionTask.finishedAt || latestInspectionTask.startedAt)}，操作人：
                {latestInspectionTask.operatorName || "admin"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {inspectionOverview.map((entry) => (
                  <div key={`inspection-overview-${entry.label}`} className="admin-subpanel px-4 py-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{entry.label}</p>
                    <p className="mt-2 break-all text-sm font-semibold text-[#1b281e]">{entry.value}</p>
                  </div>
                ))}
              </div>
              <Button size="small" onClick={() => onViewTask(latestInspectionTask)}>
                查看完整巡检结果
              </Button>
            </div>
          ) : (
            <div className="admin-empty-inline mt-5">
              <p>当前还没有系统巡检记录，建议先执行一次巡检建立基线。</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
