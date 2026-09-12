"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // 1. Registrasi Service Worker
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker terdaftar dengan scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Registrasi Service Worker gagal:", err);
          });
      });
    }

    // 2. Tangkap event beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      window.dispatchEvent(new Event("pwa-prompt-available"));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  return null;
}
