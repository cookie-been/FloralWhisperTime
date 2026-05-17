import type { BusinessHours, TimeRange } from "../types";

const WEEKDAY_LABEL_MAP: Array<{ key: keyof BusinessHours; label: string }> = [
  { key: "monday", label: "周一" },
  { key: "tuesday", label: "周二" },
  { key: "wednesday", label: "周三" },
  { key: "thursday", label: "周四" },
  { key: "friday", label: "周五" },
  { key: "saturday", label: "周六" },
  { key: "sunday", label: "周日" },
];

function formatTimeRange(range?: TimeRange) {
  if (!range || range.off) {
    return "休息";
  }
  return `${range.open}-${range.close}`;
}

export function formatBusinessHours(hours?: BusinessHours) {
  if (!hours) {
    return "";
  }
  return WEEKDAY_LABEL_MAP.map((item) => `${item.label} ${formatTimeRange(hours[item.key])}`).join("\n");
}

export function fallbackText(value: string | undefined | null, defaultValue: string) {
  if (typeof value !== "string") {
    return defaultValue;
  }
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : defaultValue;
}
