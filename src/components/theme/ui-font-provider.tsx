"use client";

import { useEffect } from "react";
import { getLocalStoreSettings } from "@/lib/settings-client";

export function UiFontProvider() {
  useEffect(() => {
    const applyFontSettings = () => {
      if (typeof document === "undefined") return;
      const settings = getLocalStoreSettings();
      const root = document.documentElement;

      const size = settings.uiFontSize || "md";
      const weight = settings.uiFontWeight || "normal";
      const family = settings.uiFontFamily || "sans";

      root.setAttribute("data-ui-font-size", size);
      root.setAttribute("data-ui-font-weight", weight);
      root.setAttribute("data-ui-font-family", family);
    };

    // Apply on mount
    applyFontSettings();

    // Listen to local changes
    window.addEventListener("pos_settings_changed", applyFontSettings);
    window.addEventListener("storage", applyFontSettings);

    return () => {
      window.removeEventListener("pos_settings_changed", applyFontSettings);
      window.removeEventListener("storage", applyFontSettings);
    };
  }, []);

  return null;
}
