"use client";

import { useState, useEffect } from "react";
import { DownloadCloud, Smartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function InstallPwaButton({ className }: { className?: string }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalledSuccess, setIsInstalledSuccess] = useState(false);

  useEffect(() => {
    // Cek apakah aplikasi sudah berjalan dalam mode standalone (terpasang)
    if (typeof window !== "undefined") {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Cek apakah prompt PWA sudah tersedia
      if ((window as any).deferredPwaPrompt) {
        setIsInstallable(true);
      }

      const handlePromptAvailable = () => {
        setIsInstallable(true);
      };

      const handleAppInstalled = () => {
        setIsInstallable(false);
        setIsStandalone(true);
        setIsInstalledSuccess(true);
        toast.success("Aplikasi My POS berhasil dipasang di perangkat ini!");
      };

      window.addEventListener("pwa-prompt-available", handlePromptAvailable);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("pwa-prompt-available", handlePromptAvailable);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  // Jika sudah terpasang dan sedang dibuka dalam mode aplikasi PWA, sembunyikan tombol
  if (isStandalone || isInstalledSuccess) {
    return null;
  }

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPwaPrompt;

    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        if (choiceResult.outcome === "accepted") {
          toast.success("Memasang My POS ke perangkat...");
          (window as any).deferredPwaPrompt = null;
          setIsInstallable(false);
        }
      } catch (err) {
        console.warn("[PWA] Prompt install error:", err);
      }
      return;
    }

    // Deteksi iOS Safari
    const isIos =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;

    if (isIos) {
      toast.info(
        "Di iPhone/iPad: Tekan ikon Bagikan (Share) di browser Safari, lalu pilih 'Tambahkan ke Layar Utama'.",
        { duration: 6000 }
      );
      return;
    }

    // Fallback Chrome / Edge desktop / Android jika prompt belum dipicu otomatis
    toast.info(
      "Klik ikon 'Install' pada bilah alamat browser Anda untuk memasang aplikasi My POS ke desktop/HP.",
      { duration: 5000 }
    );
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className={`w-full justify-start gap-2 text-xs font-semibold border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all shadow-2xs ${
        className || ""
      }`}
      title="Pasang aplikasi My POS ke komputer atau HP Anda"
    >
      <Smartphone className="w-4 h-4 text-foreground shrink-0" />
      <span>Install Aplikasi POS</span>
    </Button>
  );
}
