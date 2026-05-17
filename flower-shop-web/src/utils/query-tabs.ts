interface ResolveQueryTabOption<T extends string> {
  defaultValue: T;
  isValid: (value: string | null) => value is T;
  key?: string;
  legacyKeys?: Array<{
    key: string;
    mapping: Partial<Record<string, T>>;
  }>;
}

interface BuildQueryTabSearchParamsOption {
  key?: string;
  removeKeys?: string[];
}

export function resolveQueryTab<T extends string>(
  searchParams: URLSearchParams,
  options: ResolveQueryTabOption<T>,
) {
  const { defaultValue, isValid, key = "tab", legacyKeys = [] } = options;
  const currentValue = searchParams.get(key);

  if (isValid(currentValue)) {
    return currentValue;
  }

  for (const item of legacyKeys) {
    const legacyValue = searchParams.get(item.key);
    if (legacyValue && item.mapping[legacyValue]) {
      return item.mapping[legacyValue] as T;
    }
  }

  return defaultValue;
}

export function buildQueryTabSearchParams<T extends string>(
  searchParams: URLSearchParams,
  nextTab: T,
  options: BuildQueryTabSearchParamsOption = {},
) {
  const { key = "tab", removeKeys = [] } = options;
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set(key, nextTab);
  removeKeys.forEach((item) => nextParams.delete(item));
  return nextParams;
}
