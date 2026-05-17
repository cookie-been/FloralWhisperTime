const WEEKDAY_LABEL_MAP = [
  { key: "monday", label: "周一" },
  { key: "tuesday", label: "周二" },
  { key: "wednesday", label: "周三" },
  { key: "thursday", label: "周四" },
  { key: "friday", label: "周五" },
  { key: "saturday", label: "周六" },
  { key: "sunday", label: "周日" },
];

function formatTimeRange(range) {
  if (!range || range.off) {
    return "休息";
  }
  return `${range.open}-${range.close}`;
}

function formatBusinessHours(hours) {
  if (!hours) {
    return "";
  }
  return WEEKDAY_LABEL_MAP.map((item) => `${item.label} ${formatTimeRange(hours[item.key])}`).join("\n");
}

function fallbackText(value, defaultValue) {
  if (typeof value !== "string") {
    return defaultValue;
  }
  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : defaultValue;
}

module.exports = {
  fallbackText,
  formatBusinessHours,
};
