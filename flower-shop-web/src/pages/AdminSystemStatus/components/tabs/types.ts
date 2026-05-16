import type { LucideIcon } from "lucide-react";

export type RiskActionKey = "failed-logs" | "upload" | "backup" | "ai-settings" | "security" | "change-password";

export type RiskItem = {
  level: "error" | "warning";
  priority: number;
  title: string;
  detail: string;
  suggestion?: string;
  actionKey?: RiskActionKey;
  actionLabel?: string;
};

export type SummaryItem = {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
};

export type KeyValueEntry = {
  label: string;
  value: string;
};

export type BackupOverviewItem = {
  label: string;
  value: string;
  note: string;
};

export type TaskTypeFilter = "all" | "backup" | "inspection";
export type TaskStatusFilter = "all" | "success" | "failed";
