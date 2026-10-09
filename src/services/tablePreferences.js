import { DEFAULT_SETTINGS, validateSettings } from "../../shared/settings.js";

const STORAGE_KEY = "poker-table-settings";
const VERSION = 1;

function fullSettings(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(DEFAULT_SETTINGS).some((key) => !Object.hasOwn(value, key))
  ) {
    throw new Error("Saved table settings are incomplete.");
  }
  return validateSettings(value);
}

export function readTablePreferences(storage) {
  try {
    const saved = JSON.parse(
      (storage ?? globalThis.localStorage).getItem(STORAGE_KEY),
    );
    return saved?.version === VERSION ? fullSettings(saved.settings) : null;
  } catch {
    return null;
  }
}

export function saveTablePreferences(settings, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify({ version: VERSION, settings: fullSettings(settings) }),
    );
  } catch {
    // Remembering settings is optional; creating or configuring a room still works.
  }
}
