"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, ArrowRight } from "lucide-react";
import { StoreSettings } from "@/types/pengaturan";
import { getLocalStoreSettings } from "@/lib/settings-client";
import {
  smartPrintReceipt,
  isDirectPrinterConnected,
  getConnectedPrinterName,
} from "@/lib/direct-printer";
import { toast } from "sonner";

export interface ReceiptData {
  invoice: string;
  subtotal?: number;
  diskonPersen?: number;
  diskonNominal?: number;
  total: number;
  metodePembayaran?: string;
  referensiPembayaran?: string | null;
  bayar: number;
  kembali: number;
  catatan?: string | null;
  status?: string;
  alasanBatal?: string | null;
  date: Date | string;
  member?: {
    nama: string;
    kode: string;
  } | null;
  items: {
    nama: string;
    unitName: string;
    qty: number;
    harga: number;
    isBonus?: boolean;
    bonusLabel?: string;
  }[];

  // Kasbon Ledger Extensions
  receiptType?: "TRANSAKSI" | "PEMBAYARAN_KASBON";
  namaPelanggan?: string | null;
  tambahHutang?: number;
  potongKembalian?: number;
  saldoHutangSebelum?: number;
  saldoHutangAkhir?: number;
  jatuhTempo?: Date | string | null;
}

interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptData | null;
  onNewTransaction: () => void;
}

export function ReceiptModal({
  open,
  onOpenChange,
  data,
  onNewTransaction,
}: ReceiptModalProps) {
  const printButtonRef = useRef<HTMLButtonElement>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(getLocalStoreSettings());
  const [selectedWidth, setSelectedWidth] = useState<"58mm" | "80mm">("58mm");
  const [isDirect, setIsDirect] = useState(false);
  const [directName, setDirectName] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Sync settings when opened
  useEffect(() => {
    if (open) {
      const current = getLocalStoreSettings();
      setStoreSettings(current);
      setSelectedWidth(current.ukuranKertas || "58mm");
      setIsDirect(isDirectPrinterConnected());
      setDirectName(getConnectedPrinterName());

      // Focus ke tombol Cetak Struk secara otomatis
      setTimeout(() => {
        printButtonRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handlePrint = useCallback(async () => {
    if (!data || isPrinting) return;
    setIsPrinting(true);

    try {
      const activeSettings = { ...storeSettings, ukuranKertas: selectedWidth };
      const res = await smartPrintReceipt(data, activeSettings);

      if (res.success) {
        if (res.method === "direct") {
          toast.success("Struk berhasil dicetak ke printer direct!");
        } else {
          toast.success("Membuka printer thermal (1 lembar pas)...");
        }
      } else {
        toast.error(res.error || "Gagal mencetak struk.");
      }
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan saat mencetak.");
    } finally {
      setIsPrinting(false);
    }
  }, [data, isPrinting, storeSettings, selectedWidth]);

  const handleFinishWithoutPrint = useCallback(() => {
    onOpenChange(false);
    onNewTransaction();
  }, [onOpenChange, onNewTransaction]);

  // Keyboard navigation: Enter = Cetak Struk, Esc = Selesai Tanpa Cetak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open || isPrinting) return;
      if (e.key === "Enter") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleFinishWithoutPrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isPrinting, handlePrint, handleFinishWithoutPrint]);

  if (!data) return null;

  const d = typeof data.date === "string" ? new Date(data.date) : data.date;
  const dateFormatted = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const divider = selectedWidth === "58mm" ? "--------------------------------" : "------------------------------------------------";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 max-h-[92vh] flex flex-col gap-3">
        <DialogHeader className="pb-2 border-b text-center sm:text-center shrink-0">
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <DialogTitle className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            Transaksi Selesai!
          </DialogTitle>

          {/* Kembalian Highlight Box */}
          <div className="mt-1.5 p-2.5 bg-emerald-500/10 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/30">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Uang Kembalian
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              Rp {data.kembali.toLocaleString("id-ID")}
            </span>
          </div>

          {/* Pengaturan Cepat Kertas & Info Printer */}
          <div className="flex items-center justify-between pt-2 px-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Kertas:</span>
              <button
                type="button"
                onClick={() => setSelectedWidth("58mm")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  selectedWidth === "58mm" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setSelectedWidth("80mm")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                  selectedWidth === "80mm" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                80mm
              </button>
            </div>

            <div className="flex items-center gap-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${isDirect ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`}
              />
              <span className="text-[10.5px] font-medium text-muted-foreground">
                {isDirect ? `Direct (${directName || "BT"})` : "Driver Windows"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Preview Struk Monokrom Bersih */}
        <div className="flex-1 overflow-y-auto px-1 py-1">
          <div
            className={`mx-auto bg-white text-black p-3.5 rounded-lg border font-mono text-[11px] leading-tight select-none ${
              selectedWidth === "58mm" ? "max-w-[270px]" : "max-w-[340px]"
            }`}
            style={{ fontFamily: "'Courier New', Courier, monospace", color: "#000000" }}
          >
            <div className="text-center space-y-0.5">
              <p className="font-black text-sm uppercase tracking-wider">{storeSettings.namaToko}</p>
              {storeSettings.alamat && <p className="text-[10px]">{storeSettings.alamat}</p>}
              {storeSettings.telepon && <p className="text-[10px]">Telp/WA: {storeSettings.telepon}</p>}
            </div>

            {data.status === "BATAL" && (
              <div className="my-1.5 p-1.5 border-2 border-black text-center font-black text-xs">
                *** TRANSAKSI DIBATALKAN ***
                {data.alasanBatal && (
                  <p className="font-normal text-[9.5px] mt-0.5">Alasan: {data.alasanBatal}</p>
                )}
              </div>
            )}

            <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
              {divider}
            </div>

            {data.receiptType === "PEMBAYARAN_KASBON" ? (
              <>
                <div className="my-1.5 p-1.5 border border-black text-center font-black text-xs">
                  BUKTI PEMBAYARAN KASBON
                </div>

                <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
                  {divider}
                </div>

                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>No: {data.invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tgl: {dateFormatted}, {timeFormatted}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Pelanggan: {data.namaPelanggan || (data.member ? data.member.nama : "Umum")}</span>
                  </div>
                </div>

                <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
                  {divider}
                </div>

                <div className="space-y-0.5 font-bold">
                  <div className="flex justify-between text-[10.5px]">
                    <span>Saldo Awal:</span>
                    <span>Rp {(data.saldoHutangSebelum ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black">
                    <span>JUMLAH DIBAYAR:</span>
                    <span>Rp {data.bayar.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>METODE BAYAR:</span>
                    <span>{data.metodePembayaran || "TUNAI"}</span>
                  </div>
                  {data.referensiPembayaran && (
                    <div className="flex justify-between text-[9.5px]">
                      <span>No. Ref:</span>
                      <span>{data.referensiPembayaran}</span>
                    </div>
                  )}
                  <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
                    {divider}
                  </div>
                  <div className="flex justify-between text-xs font-black">
                    <span>SISA SALDO HUTANG:</span>
                    <span>Rp {(data.saldoHutangAkhir ?? 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>STATUS:</span>
                    <span>{(data.saldoHutangAkhir ?? 0) === 0 ? "LUNAS" : "BELUM LUNAS"}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>No: {data.invoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tgl: {dateFormatted}, {timeFormatted}</span>
                  </div>
                  {(data.namaPelanggan || data.member) && (
                    <div className="flex justify-between font-semibold">
                      <span>Pelanggan: {data.namaPelanggan || (data.member ? `${data.member.nama} (${data.member.kode})` : "Umum")}</span>
                    </div>
                  )}
                </div>

                <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
                  {divider}
                </div>

                {/* List Item Belanja */}
                <div className="space-y-1 text-[11px]">
                  {data.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between font-bold">
                        <span>{item.nama}</span>
                        <span>
                          {item.isBonus ? "GRATIS" : `Rp ${(item.harga * item.qty).toLocaleString("id-ID")}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[9.5px]">
                        <span>
                          {item.qty} {item.unitName} x Rp {item.isBonus ? "0" : item.harga.toLocaleString("id-ID")}
                        </span>
                        {item.isBonus && (
                          <span className="font-bold">({item.bonusLabel || "Bonus"})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
                  {divider}
                </div>

                {/* Ringkasan Pembayaran */}
                <div className="space-y-0.5 font-bold text-black">
                  {data.diskonNominal && data.diskonNominal > 0 ? (
                    <>
                      <div className="flex justify-between text-[10.5px]">
                        <span>Subtotal:</span>
                        <span>Rp {(data.subtotal || (data.total + data.diskonNominal)).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-[10.5px]">
                        <span>Diskon{data.diskonPersen ? ` (${data.diskonPersen}%)` : ""}:</span>
                        <span>-Rp {data.diskonNominal.toLocaleString("id-ID")}</span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between text-xs font-black">
                    <span>TOTAL BELANJA:</span>
                    <span>Rp {data.total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span>METODE:</span>
                    <span>{data.metodePembayaran || "TUNAI"}</span>
                  </div>
                  {data.referensiPembayaran && (
                    <div className="flex justify-between text-[9.5px]">
                      <span>No. Ref:</span>
                      <span>{data.referensiPembayaran}</span>
                    </div>
                  )}

                  {data.metodePembayaran === "HUTANG" ? (
                    <>
                      <div className="flex justify-between text-[10.5px]">
                        <span>DP DIBAYAR:</span>
                        <span>Rp {data.bayar.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black">
                        <span>TAMBAH HUTANG:</span>
                        <span>+Rp {(data.tambahHutang ?? (data.total - data.bayar)).toLocaleString("id-ID")}</span>
                      </div>
                      {data.saldoHutangAkhir !== undefined && (
                        <div className="flex justify-between text-xs font-black">
                          <span>TOTAL SALDO HUTANG:</span>
                          <span>Rp {data.saldoHutangAkhir.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                      {data.jatuhTempo && (
                        <div className="flex justify-between text-[9.5px]">
                          <span>Jatuh Tempo:</span>
                          <span>{typeof data.jatuhTempo === "string" ? data.jatuhTempo : new Date(data.jatuhTempo).toLocaleDateString("id-ID")}</span>
                        </div>
                      )}
                      <div className="text-center text-[9.5px] pt-3">
                        <p>Tanda Tangan Pelanggan,</p>
                        <p className="mt-5 font-bold">({data.namaPelanggan || (data.member ? data.member.nama : "....................")})</p>
                      </div>
                    </>
                  ) : data.potongKembalian && data.potongKembalian > 0 ? (
                    <>
                      <div className="flex justify-between text-[10.5px]">
                        <span>TUNAI DITERIMA:</span>
                        <span>Rp {data.bayar.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span>KEMBALIAN BELANJA:</span>
                        <span>Rp ${(data.bayar - data.total).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-[10.5px]">
                        <span>POTONG KASBON:</span>
                        <span>-Rp {data.potongKembalian.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black">
                        <span>KEMBALIAN BERSIH:</span>
                        <span>Rp {data.kembali.toLocaleString("id-ID")}</span>
                      </div>
                      {data.saldoHutangAkhir !== undefined && (
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>SISA SALDO HUTANG:</span>
                          <span>Rp {data.saldoHutangAkhir.toLocaleString("id-ID")}</span>
                        </div>
                      )}
                    </>
                  ) : (data.metodePembayaran === "TUNAI" || !data.metodePembayaran) ? (
                    <>
                      <div className="flex justify-between text-[10.5px]">
                        <span>TUNAI:</span>
                        <span>Rp {data.bayar.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-xs font-black">
                        <span>KEMBALI:</span>
                        <span>Rp {data.kembali.toLocaleString("id-ID")}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[10.5px] font-black">
                      <span>STATUS:</span>
                      <span>LUNAS</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="text-center font-bold my-1 text-[10px] overflow-hidden whitespace-nowrap">
              {divider}
            </div>

            <div className="text-center text-[9.5px] mt-2 whitespace-pre-line leading-relaxed">
              {storeSettings.footerPesan || "Terima Kasih Atas Kunjungan Anda"}
            </div>
          </div>
        </div>

        {/* Footer: HANYA 2 TOMBOL UTAMA BERSIH & JELAS */}
        <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2 shrink-0">
          <Button
            ref={printButtonRef}
            onClick={handlePrint}
            disabled={isPrinting}
            className="w-full sm:flex-1 gap-2 font-bold h-10 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            {isPrinting ? "Mencetak..." : "Cetak Struk (Enter)"}
          </Button>

          <Button
            variant="outline"
            onClick={handleFinishWithoutPrint}
            disabled={isPrinting}
            className="w-full sm:flex-1 gap-1.5 h-10"
          >
            Selesai Tanpa Cetak (Esc) <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReceiptModal;
