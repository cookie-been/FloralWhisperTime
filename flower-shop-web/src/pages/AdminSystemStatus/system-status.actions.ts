import type { OperationLogArchiveFile } from "@/types";
import type { RiskActionKey } from "./components/tabs/types";
import type { SystemTabKey } from "./system-status.constants";

export function resolveArchiveBeforeValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function resolveRiskActionTab(actionKey?: RiskActionKey): SystemTabKey | null {
  if (actionKey === "upload" || actionKey === "security") {
    return "security";
  }
  if (actionKey === "backup") {
    return "backups";
  }
  return null;
}

export function findLatestArchiveFile(
  archiveFiles: OperationLogArchiveFile[],
  archiveFilename?: string | null,
) {
  if (!archiveFilename) return null;
  return archiveFiles.find((item) => item.filename === archiveFilename) ?? null;
}

export function resolveRiskActionRoute(actionKey?: RiskActionKey) {
  if (actionKey === "failed-logs") {
    return "/admin/operation-logs?success=false";
  }
  if (actionKey === "ai-settings") {
    return "/admin/ai-settings";
  }
  return "";
}

export function shouldScrollToUploadSection(actionKey?: RiskActionKey) {
  return actionKey === "upload";
}

export function shouldScrollToSecuritySection(actionKey?: RiskActionKey) {
  return actionKey === "security";
}

export function shouldOpenPasswordModal(actionKey?: RiskActionKey) {
  return actionKey === "change-password";
}
