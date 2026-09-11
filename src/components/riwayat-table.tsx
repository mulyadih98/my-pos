"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  Receipt,
  User,
  Calendar,
  CreditCard,
  Printer,
  Ban,
  AlertTriangle,
  Wallet,
  QrCode,
  ArrowLeftRight,
  TrendingUp,
  Filter,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReceiptModal, ReceiptData } from "@/components/receipt-modal";
import { voidTransaksi } from "@/app/actions/transaksi";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type DatePreset = "HARI_INI" | "KEMARIN" | "7_HARI" | "BULAN_INI" | "SEMUA" | "KUSTOM";

export function RiwayatTable({ data }: { data: any[] }) {
  const router = useRouter();
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Filter States
  const [preset, setPreset] = useState<DatePreset>("HARI_INI");
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [selectedMethod, setSelectedMethod] = useState<string>("SEMUA");
  const [selectedStatus, setSelectedStatus] = useState<string>("SEMUA");

  // Void Dialog States
  const [voidTarget, setVoidTarget] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState<string>("Salah scan barcode / salah kuantitas");
  const [customReason, setCustomReason] = useState<string>("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Set preset range
  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (p === "HARI_INI") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === "KEMARIN") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().slice(0, 10);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (p === "7_HARI") {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 6);
      setStartDate(d7.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (p === "BULAN_INI") {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(mStart.toISOString().slice(0, 10));
      setEndDate(todayStr);
    }
  };

  // Filter Data Client-Side
  const filteredData = useMemo(() => {
    return data.filter((tx) => {
      const txDateStr = new Date(tx.createdAt).toISOString().slice(0, 10);

      // Date Range Filter
      if (preset !== "SEMUA") {
        if (startDate && txDateStr < startDate) return false;
        if (endDate && txDateStr > endDate) return false;
      }

      // Method Filter
      if (selectedMethod !== "SEMUA") {
        const txMethod = tx.metodePembayaran || "TUNAI";
        if (txMethod !== selectedMethod) return false;
      }

      // Status Filter
      if (selectedStatus !== "SEMUA") {
        const txStatus = tx.status || "SELESAI";
        if (txStatus !== selectedStatus) return false;
      }

      return true;
    });
  }, [data, preset, startDate, endDate, selectedMethod, selectedStatus]);

  // KPI Summary Metrics
  const summary = useMemo(() => {
    let totalOmset = 0;
    let totalTxSelesai = 0;
    let totalTxBatal = 0;
    let totalTunai = 0;
    let totalNonTunai = 0;

    for (const tx of filteredData) {
      if (tx.status === "BATAL") {
        totalTxBatal += 1;
      } else {
        totalTxSelesai += 1;
        totalOmset += tx.total;

        const m = tx.metodePembayaran || "TUNAI";
        if (m === "TUNAI") {
          totalTunai += tx.total;
        } else {
          totalNonTunai += tx.total;
        }
      }
    }

    return { totalOmset, totalTxSelesai, totalTxBatal, totalTunai, totalNonTunai };
  }, [filteredData]);

  // Handler Buka Struk
  const handleOpenReceipt = (tx: any) => {
    const receiptData: ReceiptData = {
      invoice: tx.invoice,
      subtotal: tx.subtotal || tx.total,
      diskonPersen: tx.diskonPersen,
      diskonNominal: tx.diskonNominal,
      total: tx.total,
      metodePembayaran: tx.metodePembayaran || "TUNAI",
      referensiPembayaran: tx.referensiPembayaran,
      bayar: tx.bayar,
      kembali: tx.kembali,
      catatan: tx.catatan,
      status: tx.status || "SELESAI",
      alasanBatal: tx.alasanBatal,
      date: tx.createdAt,
      member: tx.member ? { nama: tx.member.nama, kode: tx.member.kode } : null,
      items: tx.items.map((item: any) => ({
        nama: item.barang?.nama || "Produk",
        unitName: item.varian?.unit?.name || "Pcs",
        qty: item.qty,
        harga: item.hargaJual,
        isBonus: item.isBonus,
        bonusLabel: item.promo?.nama || "Bonus",
      })),
    };
    setSelectedReceipt(receiptData);
    setIsReceiptOpen(true);
  };

  // Handler Konfirmasi Void
  const handleExecuteVoid = async () => {
    if (!voidTarget) return;

    const finalReason = voidReason === "Lainnya" ? customReason.trim() : voidReason;
    if (!finalReason) {
      toast.error("Alasan pembatalan harus diisi!");
      return;
    }

    setIsVoiding(true);
    try {
      await voidTransaksi(voidTarget.id, finalReason);
      toast.success(`Transaksi ${voidTarget.invoice} berhasil dibatalkan dan stok dikembalikan!`);
      setVoidTarget(null);
      setCustomReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal membatalkan transaksi");
    } finally {
      setIsVoiding(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
          title="Lihat rincian item transaksi"
        >
          {row.getIsExpanded() ? (
            <ChevronDown size={18} className="text-primary" />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      ),
    },
    {
      accessorKey: "invoice",
      header: "Invoice",
      cell: ({ row }) => {
        const isBatal = row.original.status === "BATAL";
        return (
          <div className="flex items-center gap-2">
            <Receipt className={`w-4 h-4 ${isBatal ? "text-destructive" : "text-muted-foreground"}`} />
            <span className={`font-mono font-bold ${isBatal ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {row.original.invoice}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal & Waktu",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        );
      },
    },
    {
      accessorFn: (row) => row.member?.nama || "Umum (Retail)",
      id: "member",
      header: "Pelanggan",
      cell: ({ row }) => {
        const member = row.original.member;
        return (
          <div className="flex items-center gap-2">
            <User className={`w-4 h-4 ${member ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex flex-col">
              <span className={member ? "font-semibold text-sm text-foreground" : "text-muted-foreground text-sm"}>
                {member ? member.nama : "Umum (Retail)"}
              </span>
              {member && <span className="text-[10px] text-muted-foreground">{member.kode}</span>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "metodePembayaran",
      header: "Metode",
      cell: ({ row }) => {
        const method = row.original.metodePembayaran || "TUNAI";
        return (
          <div className="flex items-center gap-1.5">
            {method === "TUNAI" && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-bold gap-1">
                <Wallet className="w-3 h-3" /> TUNAI
              </Badge>
            )}
            {method === "QRIS" && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 text-xs font-bold gap-1">
                <QrCode className="w-3 h-3" /> QRIS
              </Badge>
            )}
            {method === "TRANSFER" && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 text-xs font-bold gap-1">
                <ArrowLeftRight className="w-3 h-3" /> TRANSFER
              </Badge>
            )}
            {method === "DEBIT" && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 text-xs font-bold gap-1">
                <CreditCard className="w-3 h-3" /> DEBIT
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total Belanja",
      cell: ({ row }) => {
        const isBatal = row.original.status === "BATAL";
        return (
          <div className="flex flex-col">
            <span className={`font-bold font-mono ${isBatal ? "line-through text-muted-foreground" : "text-primary"}`}>
              Rp {row.original.total.toLocaleString("id-ID")}
            </span>
            {row.original.diskonNominal > 0 && (
              <span className="text-[10px] text-red-500 font-medium">
                Hemat Rp {row.original.diskonNominal.toLocaleString("id-ID")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isBatal = row.original.status === "BATAL";
        return isBatal ? (
          <Badge variant="destructive" className="font-bold text-[10.5px] uppercase tracking-wide gap-1">
            <XCircle className="w-3 h-3" /> Void / Batal
          </Badge>
        ) : (
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] uppercase tracking-wide gap-1">
            <CheckCircle2 className="w-3 h-3" /> Lunas
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const tx = row.original;
        const isBatal = tx.status === "BATAL";

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReceipt(tx);
              }}
              className="gap-1.5 h-8 text-xs font-semibold"
              title="Cetak Struk Transaksi"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak
            </Button>

            {!isBatal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setVoidTarget(tx);
                  setVoidReason("Salah scan barcode / salah kuantitas");
                  setCustomReason("");
                }}
                className="gap-1 h-8 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
                title="Batalkan (Void) transaksi ini dan kembalikan stok barang"
              >
                <Ban className="w-3.5 h-3.5" /> Void
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const renderItems = (row: any) => {
    const tx = row.original;
    const items = tx.items || [];
    const isBatal = tx.status === "BATAL";

    return (
      <div className="p-4 bg-muted/20 border-y space-y-3 animate-in fade-in duration-150">
        {/* Banner Transaksi Batal jika Void */}
        {isBatal && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-xs text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Transaksi Ini Telah Dibatalkan (VOID)</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Alasan: <span className="font-semibold text-foreground">{tx.alasanBatal || "Tidak ada rincian"}</span>
                {tx.batalAt && (
                  <span className="ml-2">
                    pada {new Date(tx.batalAt).toLocaleString("id-ID")}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">
                ✓ Stok barang otomatis telah dikembalikan ke inventori toko.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Rincian Item Belanja ({items.length} Macam Barang)
          </h4>
          {tx.catatan && (
            <span className="text-xs text-muted-foreground italic">
              Catatan: &ldquo;{tx.catatan}&rdquo;
            </span>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none h-8">
              <TableHead className="h-8 text-xs">Barang</TableHead>
              <TableHead className="h-8 text-xs text-right">Harga</TableHead>
              <TableHead className="h-8 text-xs text-center">Qty</TableHead>
              <TableHead className="h-8 text-xs text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow
                key={item.id}
                className={`hover:bg-transparent border-none h-10 ${
                  item.isBonus ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                }`}
              >
                <TableCell className="py-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm">{item.barang?.nama || "Produk"}</p>
                    {item.isBonus && (
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-400/50 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.promo ? `PROMO: ${item.promo.nama}` : "GRATIS / BONUS"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {item.varian?.unit?.name || "Pcs"}
                  </p>
                </TableCell>
                <TableCell className="py-1 text-right text-sm">
                  {item.isBonus ? (
                    <span className="text-emerald-600 font-semibold">Rp 0 (Bonus)</span>
                  ) : (
                    `Rp ${item.hargaJual.toLocaleString("id-ID")}`
                  )}
                </TableCell>
                <TableCell className="py-1 text-center text-sm font-semibold">
                  {item.qty}
                </TableCell>
                <TableCell className="py-1 text-right font-semibold text-sm">
                  {item.isBonus ? (
                    <span className="text-emerald-600 font-bold">Rp 0</span>
                  ) : (
                    `Rp ${item.subtotal.toLocaleString("id-ID")}`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Ringkasan Pembayaran Faktur */}
        <div className="flex flex-wrap justify-end gap-6 sm:gap-10 pt-3 border-t border-dashed text-xs">
          {tx.diskonNominal > 0 && (
            <>
              <div className="text-right">
                <p className="text-muted-foreground">Subtotal</p>
                <p className="font-medium">
                  Rp {(tx.subtotal || tx.total + tx.diskonNominal).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="text-right text-red-600 font-medium">
                <p>Diskon{tx.diskonPersen ? ` (${tx.diskonPersen}%)` : ""}</p>
                <p>-Rp {tx.diskonNominal.toLocaleString("id-ID")}</p>
              </div>
            </>
          )}
          <div className="text-right">
            <p className="text-muted-foreground">Total Tagihan</p>
            <p className="font-bold text-sm text-primary font-mono">
              Rp {tx.total.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Metode Bayar</p>
            <p className="font-bold uppercase">{tx.metodePembayaran || "TUNAI"}</p>
            {tx.referensiPembayaran && (
              <p className="text-[10px] text-muted-foreground font-mono">
                Ref: {tx.referensiPembayaran}
              </p>
            )}
          </div>
          {(tx.metodePembayaran === "TUNAI" || !tx.metodePembayaran) && (
            <>
              <div className="text-right">
                <p className="text-muted-foreground">Uang Diterima</p>
                <p className="font-medium">Rp {tx.bayar.toLocaleString("id-ID")}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Kembalian</p>
                <p className="font-bold text-emerald-600">
                  Rp {tx.kembali.toLocaleString("id-ID")}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Omset Lunas
              </p>
              <p className="text-lg sm:text-2xl font-black text-primary font-mono mt-0.5">
                Rp {summary.totalOmset.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Transaksi Berhasil
              </p>
              <p className="text-lg sm:text-2xl font-black text-foreground font-mono mt-0.5">
                {summary.totalTxSelesai}
                {summary.totalTxBatal > 0 && (
                  <span className="text-xs font-normal text-muted-foreground ml-1.5">
                    ({summary.totalTxBatal} Void)
                  </span>
                )}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Omset Tunai (Cash)
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground font-mono mt-0.5">
                Rp {summary.totalTunai.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Non-Tunai (QRIS/EDC)
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground font-mono mt-0.5">
                Rp {summary.totalNonTunai.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-xs border bg-card">
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Waktu:
              </span>
              {(
                [
                  { key: "HARI_INI", label: "Hari Ini" },
                  { key: "KEMARIN", label: "Kemarin" },
                  { key: "7_HARI", label: "7 Hari" },
                  { key: "BULAN_INI", label: "Bulan Ini" },
                  { key: "SEMUA", label: "Semua" },
                  { key: "KUSTOM", label: "Kustom" },
                ] as const
              ).map((p) => (
                <Button
                  key={p.key}
                  variant={preset === p.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(p.key)}
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  {p.label}
                </Button>
              ))}
            </div>

            {/* Method & Status Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-muted-foreground">Metode:</span>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="h-7 text-xs rounded-md border bg-background px-2 py-0 text-foreground font-medium"
                >
                  <option value="SEMUA">Semua Metode</option>
                  <option value="TUNAI">Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="DEBIT">Debit / EDC</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-7 text-xs rounded-md border bg-background px-2 py-0 text-foreground font-medium"
                >
                  <option value="SEMUA">Semua Status</option>
                  <option value="SELESAI">Lunas (Selesai)</option>
                  <option value="BATAL">Dibatalkan (Void)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Date Picker Range if Custom */}
          {preset === "KUSTOM" && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
              <span className="font-semibold text-muted-foreground">Dari:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-36 text-xs"
              />
              <span className="font-semibold text-muted-foreground">Sampai:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-36 text-xs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable columns={columns} data={filteredData} renderSubComponent={renderItems} />

      {/* Modal Cetak Struk */}
      <ReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={selectedReceipt}
        onNewTransaction={() => setIsReceiptOpen(false)}
      />

      {/* Dialog Konfirmasi Pembatalan (Void) */}
      <Dialog open={Boolean(voidTarget)} onOpenChange={(open) => !open && setVoidTarget(null)}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" /> Batalkan Transaksi (Void)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transaksi yang dibatalkan akan otomatis mengembalikan stok barang ke gudang/toko dan
              dikeluarkan dari laporan omset laba rugi.
            </DialogDescription>
          </DialogHeader>

          {voidTarget && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-muted/60 rounded-xl space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span>No. Invoice:</span>
                  <span>{voidTarget.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Tagihan:</span>
                  <span className="font-bold text-primary font-mono">
                    Rp {voidTarget.total.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pelanggan:</span>
                  <span>{voidTarget.member?.nama || "Umum (Retail)"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground block">
                  Pilih Alasan Pembatalan:
                </label>
                <div className="space-y-1.5">
                  {[
                    "Salah scan barcode / salah kuantitas",
                    "Pembeli membatalkan pembelian",
                    "Barang dikembalikan / rusak",
                    "Salah metode pembayaran",
                    "Lainnya",
                  ].map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted/40 cursor-pointer text-xs"
                    >
                      <input
                        type="radio"
                        name="voidReason"
                        value={r}
                        checked={voidReason === r}
                        onChange={(e) => setVoidReason(e.target.value)}
                        className="text-primary"
                      />
                      <span>{r}</span>
                    </label>
                  ))}
                </div>

                {voidReason === "Lainnya" && (
                  <Input
                    placeholder="Ketik alasan pembatalan..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="h-9 text-xs mt-2"
                    autoFocus
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setVoidTarget(null)}
              disabled={isVoiding}
              className="h-9 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleExecuteVoid}
              disabled={isVoiding}
              className="h-9 text-xs font-bold gap-1"
            >
              <Ban className="w-3.5 h-3.5" />
              {isVoiding ? "Membatalkan..." : "Ya, Batalkan Transaksi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
