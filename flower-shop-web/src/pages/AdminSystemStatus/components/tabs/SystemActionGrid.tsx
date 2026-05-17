import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Tag } from "antd";

export type SystemActionCardItem = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  command?: string;
  resultTitle?: string;
  resultStatus?: "success" | "warning" | "error" | "default";
  resultSummary?: string;
  resultMeta?: string;
  auditMeta?: string;
  action: ReactNode;
};

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  items: SystemActionCardItem[];
};

export function SystemActionGrid({ eyebrow, title, description, items }: Props) {
  return (
    <section className="admin-panel admin-shell-card sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h3 className="admin-section-title mt-2 text-xl">{title}</h3>
          {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        <Tag color="blue">统一动作模型</Tag>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="admin-subpanel px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#edf4eb] text-forest">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#1b281e]">{item.title}</p>
                      {item.badge ? <Tag color="green">{item.badge}</Tag> : null}
                    </div>
                    <p className="mt-2 text-xs leading-6 text-muted">{item.description}</p>
                  </div>
                </div>
                <div className="shrink-0">{item.action}</div>
              </div>
              {item.command ? (
                <pre className="mt-4 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#f7f8f5] p-3 text-xs text-[#1b281e]">
                  {item.command}
                </pre>
              ) : null}
              {item.resultTitle || item.resultSummary ? (
                <div className="mt-4 rounded-lg border border-[rgba(41,57,46,0.08)] bg-white/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold text-[#1b281e]">{item.resultTitle || "最近结果"}</p>
                    {item.resultStatus ? (
                      <Tag
                        color={
                          item.resultStatus === "success"
                            ? "green"
                            : item.resultStatus === "warning"
                              ? "gold"
                              : item.resultStatus === "error"
                                ? "red"
                                : "default"
                        }
                      >
                        {item.resultStatus === "success"
                          ? "成功"
                          : item.resultStatus === "warning"
                            ? "待关注"
                            : item.resultStatus === "error"
                              ? "异常"
                              : "暂无"}
                      </Tag>
                    ) : null}
                  </div>
                  {item.resultSummary ? <p className="mt-2 text-xs leading-6 text-muted">{item.resultSummary}</p> : null}
                  {item.resultMeta ? <p className="mt-2 text-[11px] leading-5 text-muted">{item.resultMeta}</p> : null}
                  {item.auditMeta ? <p className="mt-1 text-[11px] leading-5 text-muted">{item.auditMeta}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
