import { Button, Segmented, Tag } from "antd";
import type { AdminOpsTask } from "@/types";
import type { KeyValueEntry, TaskStatusFilter, TaskTypeFilter } from "./types";

type Props = {
  filteredOpsTasks: AdminOpsTask[];
  opsTasks: AdminOpsTask[];
  opsTasksError: string;
  taskStats: {
    failed: number;
    inspection: number;
    backup: number;
  };
  taskTypeFilter: TaskTypeFilter;
  taskStatusFilter: TaskStatusFilter;
  setTaskTypeFilter: (value: TaskTypeFilter) => void;
  setTaskStatusFilter: (value: TaskStatusFilter) => void;
  setSelectedTask: (task: AdminOpsTask) => void;
  getTaskStatusMeta: (status?: string) => { color: "green" | "red" | "blue"; label: string };
  formatTaskTypeLabel: (value?: string) => string;
  formatDateTime: (value?: string) => string;
  getTaskResultEntries: (task: AdminOpsTask) => KeyValueEntry[];
};

export function SystemTasksTab({
  filteredOpsTasks,
  opsTasks,
  opsTasksError,
  taskStats,
  taskTypeFilter,
  taskStatusFilter,
  setTaskTypeFilter,
  setTaskStatusFilter,
  setSelectedTask,
  getTaskStatusMeta,
  formatTaskTypeLabel,
  formatDateTime,
  getTaskResultEntries,
}: Props) {
  return (
    <div className="space-y-6 pt-2">
      <section className="admin-panel admin-shell-card sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow">任务记录</p>
            <h3 className="admin-section-title mt-2 text-xl">最近运维任务</h3>
          </div>
          <Tag color={filteredOpsTasks.length ? "green" : "default"}>{filteredOpsTasks.length} 条</Tag>
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="admin-subpanel px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">失败任务</p>
              <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.failed}</p>
              <p className="mt-2 text-xs leading-6 text-muted">优先排查失败备份、失败巡检和连续异常记录。</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">巡检任务</p>
              <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.inspection}</p>
              <p className="mt-2 text-xs leading-6 text-muted">用于观察后台是否形成固定巡检节奏。</p>
            </div>
            <div className="admin-subpanel px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted">备份任务</p>
              <p className="mt-2 text-2xl font-semibold text-[#1b281e]">{taskStats.backup}</p>
              <p className="mt-2 text-xs leading-6 text-muted">用于判断人工备份执行频率是否满足交付要求。</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-3">
              <Segmented
                value={taskTypeFilter}
                onChange={(value) => setTaskTypeFilter(value as TaskTypeFilter)}
                options={[
                  { label: "全部任务", value: "all" },
                  { label: "手动备份", value: "backup" },
                  { label: "系统巡检", value: "inspection" },
                ]}
              />
              <Segmented
                value={taskStatusFilter}
                onChange={(value) => setTaskStatusFilter(value as TaskStatusFilter)}
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "成功", value: "success" },
                  { label: "失败", value: "failed" },
                ]}
              />
            </div>
            <p className="text-xs text-muted">
              当前显示 {filteredOpsTasks.length} / {opsTasks.length} 条
            </p>
          </div>

          {filteredOpsTasks.length ? (
            filteredOpsTasks.map((item) => (
              <div key={item.id} className="admin-subpanel px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#1b281e]">{item.taskLabel || formatTaskTypeLabel(item.taskType)}</p>
                      <Tag color={getTaskStatusMeta(item.status).color}>{getTaskStatusMeta(item.status).label}</Tag>
                    </div>
                    <p className="mt-2 text-muted">类型：{item.taskType} · 操作人：{item.operatorName || "admin"}</p>
                    <p className="mt-2 text-muted">
                      开始：{formatDateTime(item.startedAt)} · 完成：{formatDateTime(item.finishedAt)}
                    </p>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      {getTaskResultEntries(item).slice(0, 4).map((entry) => (
                        <div key={`${item.id}-${entry.label}`} className="rounded-lg border border-[rgba(41,57,46,0.08)] bg-white/70 px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{entry.label}</p>
                          <p className="mt-1 break-all text-xs text-[#1b281e]">{entry.value}</p>
                        </div>
                      ))}
                    </div>
                    {item.errorMessage ? <p className="mt-2 text-xs text-[#b33a3a]">{item.errorMessage}</p> : null}
                  </div>
                  <Button size="small" onClick={() => setSelectedTask(item)}>
                    查看详情
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="admin-empty-inline">
              <p>{opsTasksError ? opsTasksError : opsTasks.length ? "当前筛选条件下没有匹配的运维任务。" : "当前还没有后台触发的运维任务记录。"}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
