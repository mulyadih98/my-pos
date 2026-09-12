"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpenCheck,
  Search,
  Wallet,
  QrCode,
  ArrowLeftRight,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { searchKasbonForPOS, bayarKasbonLangsung } from "@/app/actions/kasbon";
import { toast } from "sonner";
import { ReceiptData } from "@/components/receipt-modal";
import { playSuccessChime, playErrorSound } from "@/lib/sound";

interface BayarKasbonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: (receiptData: ReceiptData) => void;
}

export function BayarKasbonDialog({
  open,
  onOpenChange,
  onPaymentSuccess,
}: BayarKasbonDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedKasbon, setSelectedKasbon] = useState<any | null>(null);
  const [jumlahBayar, setJumlahBayar] = useState<number>(0);
  const [metode, setMetode] = useState<"TUNAI" | "QRIS" | "TRANSFER" | "DEBIT">("TUNAI");
  const [referensi, setReferensi] = useState("");
  const [catatan, setCatatan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    setIsLoading(true);
    try {
      const res = await searchKasbonForPOS(q);
      setSearchResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load initial list on open
  useEffect(() => {
    if (open) {
      handleSearch("");
      setJumlahBayar(0);
      setReferensi("");
      setCatatan("");
      setSelectedKasbon(null);
    }
  }, [open, handleSearch]);

  const handleSelect = (item: any) => {
    setSelectedKasbon(item);
    setJumlahBayar(item.saldoHutang); // default lunasi semua
  };

  const handleProcessPayment = async () => {
    if (!selectedKasbon) {
      toast.error("Pilih pelanggan kasbon terlebih dahulu.");
      return;
    }

    if (jumlahBayar <= 0) {
      toast.error("Nominal pembayaran harus lebih dari Rp 0.");
      playErrorSound();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bayarKasbonLangsung({
        kasbonId: selectedKasbon.id,
        jumlahBayar,
        metode,
        referensi: referensi.trim() || undefined,
        catatan: catatan.trim() || undefined,
      });

      if (res.success && res.data) {
        playSuccessChime();
        toast.success(
          `Pembayaran kasbon "${res.data.namaPelanggan}" sebesar Rp ${res.data.bayarBersih.toLocaleString(
            "id-ID"
          )} berhasil dicatat!`
        );

        // Format data struk bukti tanda terima
        const receipt: ReceiptData = {
          invoice: res.data.noPembayaran,
          total: res.data.bayarBersih,
          bayar: res.data.bayarBersih,
          kembali: 0,
          metodePembayaran: metode,
          referensiPembayaran: referensi.trim() || null,
          date: new Date(),
          catatan: catatan.trim() || null,
          receiptType: "PEMBAYARAN_KASBON",
          namaPelanggan: res.data.namaPelanggan,
          saldoHutangSebelum: res.data.saldoSebelum,
          saldoHutangAkhir: res.data.saldoSesudah,
          items: [],
        };

        onOpenChange(false);
        onPaymentSuccess(receipt);
      }
    } catch (err: any) {
      playErrorSound();
      toast.error(err.message || "Gagal mencatat pembayaran kasbon.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BookOpenCheck className="w-5 h-5 text-amber-500" />
            Pembayaran Kasbon / Hutang
          </DialogTitle>
          <DialogDescription className="text-xs">
            Catat cicilan atau pelunasan kasbon pelanggan (Tunai / Non-Tunai) dan cetak struk tanda terima.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-1 text-xs">
          {/* Step 1: Pilih Pelanggan Kasbon */}
          {!selectedKasbon ? (
            <div className="space-y-2">
              <label className="font-bold text-muted-foreground uppercase tracking-wider block">
                Cari Pelanggan Berhutang:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Ketik nama atau no. telepon..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 border rounded-xl p-1 bg-muted/20 divide-y">
                {isLoading ? (
                  <p className="p-4 text-center text-muted-foreground">Mencari data...</p>
                ) : searchResults.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground">
                    Tidak ada pelanggan dengan saldo hutang aktif.
                  </p>
                ) : (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className="p-2.5 hover:bg-muted/80 rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm text-foreground">{item.namaPelanggan}</p>
                        <p className="text-[10.5px] text-muted-foreground">
                          {item.telepon || "Tanpa Telepon"} {item.member ? `• Member: ${item.member.kode}` : "• Non-Member"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-amber-600 text-xs sm:text-sm">
                          Rp {item.saldoHutang.toLocaleString("id-ID")}
                        </p>
                        <span className="text-[9.5px] text-muted-foreground font-medium">Saldo Kasbon</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Form Pembayaran Kasbon */
            <div className="space-y-3">
              {/* Info Pelanggan Terpilih */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-foreground">{selectedKasbon.namaPelanggan}</span>
                    {selectedKasbon.member ? (
                      <Badge variant="outline" className="text-[9px] py-0">Member</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] py-0">Non-Member</Badge>
                    )}
                  </div>
                  <p className="text-[10.5px] text-muted-foreground mt-0.5">
                    {selectedKasbon.telepon || "Tanpa No. HP"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-semibold">Total Saldo Hutang:</p>
                  <p className="font-mono font-black text-amber-600 text-base sm:text-lg">
                    Rp {selectedKasbon.saldoHutang.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>

              {/* Input Nominal Bayar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-muted-foreground uppercase tracking-wider">
                    Nominal Pembayaran:
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setJumlahBayar(selectedKasbon.saldoHutang)}
                    className="h-5 px-1.5 text-[10.5px] text-primary hover:underline font-bold"
                  >
                    Lunasi Penuh (Rp {selectedKasbon.saldoHutang.toLocaleString("id-ID")})
                  </Button>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    type="number"
                    value={jumlahBayar || ""}
                    onChange={(e) =>
                      setJumlahBayar(Math.min(selectedKasbon.saldoHutang, Number(e.target.value)))
                    }
                    className="pl-9 h-11 text-xl font-bold font-mono bg-background"
                    placeholder="0"
                    autoFocus
                  />
                </div>

                {/* Shortcut Pecahan Cepat */}
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {[20000, 50000, 100000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setJumlahBayar(Math.min(selectedKasbon.saldoHutang, amt))}
                      className="text-[11px] font-semibold h-8"
                    >
                      +{amt.toLocaleString("id-ID")}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setJumlahBayar(selectedKasbon.saldoHutang)}
                    className="text-[11px] font-bold h-8 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Lunas
                  </Button>
                </div>
              </div>

              {/* Pilihan Metode Pembayaran (Tunai / Non-Tunai) */}
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase tracking-wider block">
                  Metode Pembayaran:
                </label>
                <div className="grid grid-cols-4 gap-1 bg-muted/60 p-1 rounded-xl border">
                  {(["TUNAI", "QRIS", "TRANSFER", "DEBIT"] as const).map((m) => {
                    const isActive = metode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMetode(m)}
                        className={`py-1.5 text-center rounded-lg font-bold text-[10.5px] transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isActive
                            ? "bg-background text-primary shadow-xs border border-primary/40"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {m === "TUNAI" && <Wallet className="w-3.5 h-3.5" />}
                        {m === "QRIS" && <QrCode className="w-3.5 h-3.5" />}
                        {m === "TRANSFER" && <ArrowLeftRight className="w-3.5 h-3.5" />}
                        {m === "DEBIT" && <CreditCard className="w-3.5 h-3.5" />}
                        <span>{m}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* No. Referensi jika Non-Tunai */}
              {metode !== "TUNAI" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    No. Referensi / Bukti Transfer / RRN:
                  </label>
                  <Input
                    placeholder="Contoh: BCA a/n Budi / RRN QRIS..."
                    value={referensi}
                    onChange={(e) => setReferensi(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}

              {/* Catatan */}
              <div className="space-y-1">
                <Input
                  placeholder="Catatan pembayaran kasbon (opsional)..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              {/* Ringkasan Sisa Saldo Setelah Bayar */}
              <div className="p-3 bg-muted/40 rounded-xl border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Sisa Saldo Kasbon:</span>
                <span className="font-mono font-black text-sm text-foreground">
                  Rp {Math.max(0, selectedKasbon.saldoHutang - jumlahBayar).toLocaleString("id-ID")}
                  {selectedKasbon.saldoHutang - jumlahBayar === 0 && (
                    <span className="ml-1.5 text-emerald-600 font-bold">(LUNAS)</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t flex flex-col sm:flex-row gap-2">
          {selectedKasbon ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedKasbon(null)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Ganti Pelanggan
              </Button>
              <Button
                type="button"
                onClick={handleProcessPayment}
                disabled={isSubmitting || jumlahBayar <= 0}
                className="h-9 text-xs font-bold gap-1.5 flex-1 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? "Menyimpan..." : "Bayar & Cetak Struk"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-9 text-xs"
            >
              Tutup
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
