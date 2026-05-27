import { LOCAL_STORAGE_KEY_PREFIX } from "@/constants/storage";
import { storage } from "@/hooks/use-local-storage";

export function hasStoredJson(key: string) {
  return storage.contains(LOCAL_STORAGE_KEY_PREFIX + key);
}

export function readStoredJson<T>(key: string, fallback: T): T {
  try {
    const rawValue = storage.getString(LOCAL_STORAGE_KEY_PREFIX + key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

export function writeStoredJson<T>(key: string, value: T) {
  storage.set(LOCAL_STORAGE_KEY_PREFIX + key, JSON.stringify(value));
}
