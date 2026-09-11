"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Html5Qrcode } from "html5-qrcode";
import { ScanBarcode, Camera, X, Zap, RefreshCw, Layers } from "lucide-react";
import { toast } from "sonner";

interface CameraScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => boolean | void; // return true if item found
}

export function CameraScannerDialog({
  open,
  onOpenChange,
  onScan,
}: CameraScannerDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isContinuous, setIsContinuous] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const qrRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const readerId = "html5-pos-scanner-viewport";

  const stopScanner = async () => {
    if (qrRef.current) {
      try {
        if (qrRef.current.isScanning) {
          await qrRef.current.stop();
        }
        await qrRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner:", e);
      } finally {
        qrRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const startScanner = async () => {
    if (isScanning || !open) return;

    // Tunggu kontainer DOM siap
    setTimeout(async () => {
      const container = document.getElementById(readerId);
      if (!container) return;

      try {
        const qr = new Html5Qrcode(readerId);
        qrRef.current = qr;

        await qr.start(
          { facingMode: "environment" }, // Kamera belakang HP/Tablet
          {
            fps: 12,
            qrbox: { width: 250, height: 220 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            const now = Date.now();
            // Cegah scan ganda dalam 1.2 detik
            if (now - lastScanTimeRef.current < 1200) {
              return;
            }
            lastScanTimeRef.current = now;

            const code = decodedText.trim();
            setLastScanned(code);
            setScannedCount((prev) => prev + 1);

            // Teruskan kode barcode/QR ke fungsi parent
            const result = onScan(code);

            // Jika bukan mode beruntun, langsung tutup scanner
            if (!isContinuous) {
              await stopScanner();
              onOpenChange(false);
            }
          },
          () => {
            // Frame scan tanpa barcode (abaikan log)
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        console.error("Gagal start camera scanner:", err);
        toast.error("Gagal mengakses kamera: " + (err.message || "Izin kamera ditolak"));
        setIsScanning(false);
      }
    }, 200);
  };

  useEffect(() => {
    if (open) {
      setLastScanned(null);
      setScannedCount(0);
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const handleClose = async () => {
    await stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-sm p-4 w-[92vw] rounded-2xl overflow-hidden flex flex-col gap-3">
        <DialogHeader className="pb-1 text-center sm:text-center">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="gap-1 text-[10px] font-bold">
              <Camera className="w-3 h-3 text-primary" /> Kamera HP / Tab
            </Badge>

            {/* Toggle Mode: Sekali Scan vs Scan Beruntun */}
            <button
              type="button"
              onClick={() => setIsContinuous((prev) => !prev)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                isContinuous
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title="Aktifkan mode scan berkali-kali tanpa menutup kamera"
            >
              <Layers className="w-3 h-3" />
              {isContinuous ? "Scan Beruntun: AKTIF" : "Mode Sekali Scan"}
            </button>
          </div>

          <DialogTitle className="text-base font-bold flex items-center justify-center gap-1.5 mt-1">
            <ScanBarcode className="w-4 h-4 text-primary" /> Pindai Barcode / QR
          </DialogTitle>
          <DialogDescription className="text-xs">
            Arahkan kamera ke barcode produk atau kode QR.
          </DialogDescription>
        </DialogHeader>

        {/* Viewport Kamera dengan Laser Animation Box */}
        <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center border shadow-inner">
          <div id={readerId} className="w-full h-full" />

          {/* Kotak Bidik & Garis Laser */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[240px] h-[210px] border-2 border-white/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              {/* Corner Indicators */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-sm" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-sm" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-sm" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-sm" />

              {/* Animated Laser Line */}
              {isScanning && (
                <div className="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.8)] animate-pulse top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>
        </div>

        {/* Status Terakhir Terbaca */}
        {lastScanned && (
          <div className="p-2 bg-muted/60 rounded-lg border text-center text-xs space-y-0.5 animate-in fade-in">
            <span className="text-[10px] text-muted-foreground block">
              Terakhir Terbaca ({scannedCount}x scan):
            </span>
            <span className="font-mono font-bold text-foreground text-xs">{lastScanned}</span>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[11px] text-muted-foreground">
            {isContinuous ? "💡 Terus arahkan kamera ke barcode" : "💡 Menutup otomatis setelah terbaca"}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="h-8 px-3 text-xs font-semibold"
          >
            Selesai / Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
