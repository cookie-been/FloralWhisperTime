export function safeReadStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeWriteStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore storage write failures
  }
}

export function safeRemoveStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore storage remove failures
  }
}

export function safeReadJsonStorage<T>(key: string, fallbackValue: T): T {
  const rawValue = safeReadStorage(key);
  if (!rawValue) {
    return fallbackValue;
  }
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    safeRemoveStorage(key);
    return fallbackValue;
  }
}
