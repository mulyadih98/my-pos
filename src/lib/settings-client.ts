import { StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/pengaturan";

export const LOCAL_STORAGE_KEY = "pos_store_settings";

export function getLocalStoreSettings(defaultFromDb?: StoreSettings): StoreSettings {
  if (typeof window === "undefined") {
    return defaultFromDb || DEFAULT_STORE_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        namaToko: parsed.namaToko || defaultFromDb?.namaToko || DEFAULT_STORE_SETTINGS.namaToko,
        alamat: parsed.alamat ?? defaultFromDb?.alamat ?? DEFAULT_STORE_SETTINGS.alamat,
        telepon: parsed.telepon ?? defaultFromDb?.telepon ?? DEFAULT_STORE_SETTINGS.telepon,
        footerPesan: parsed.footerPesan ?? defaultFromDb?.footerPesan ?? DEFAULT_STORE_SETTINGS.footerPesan,
        ukuranKertas: parsed.ukuranKertas || defaultFromDb?.ukuranKertas || DEFAULT_STORE_SETTINGS.ukuranKertas,
        uiFontSize: parsed.uiFontSize || defaultFromDb?.uiFontSize || DEFAULT_STORE_SETTINGS.uiFontSize,
        uiFontWeight: parsed.uiFontWeight || defaultFromDb?.uiFontWeight || DEFAULT_STORE_SETTINGS.uiFontWeight,
        uiFontFamily: parsed.uiFontFamily || defaultFromDb?.uiFontFamily || DEFAULT_STORE_SETTINGS.uiFontFamily,
      };
    }
  } catch (e) {
    console.warn("Gagal membaca localStorage settings:", e);
  }

  return defaultFromDb || DEFAULT_STORE_SETTINGS;
}

export function saveLocalStoreSettings(settings: StoreSettings) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event("pos_settings_changed"));
  } catch (e) {
    console.error("Gagal menyimpan ke localStorage:", e);
  }
}

export function clearLocalStoreSettings() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.dispatchEvent(new Event("pos_settings_changed"));
  } catch (e) {
    console.error("Gagal menghapus localStorage:", e);
  }
}
