const DEFAULT_IGNORED_ROW_CLICK_SELECTORS = [
  "button",
  ".ant-btn",
  ".ant-checkbox-wrapper",
  ".ant-checkbox",
  ".ant-popover",
  ".ant-popconfirm",
];

export function shouldIgnoreTableRowClick(target: EventTarget | null, extraSelectors: string[] = []) {
  if (!(target instanceof HTMLElement)) return false;
  const selector = [...DEFAULT_IGNORED_ROW_CLICK_SELECTORS, ...extraSelectors].join(", ");
  return Boolean(target.closest(selector));
}
