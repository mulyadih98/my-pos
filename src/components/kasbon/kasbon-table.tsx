"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  BookOpenCheck,
  User,
  Phone,
  Calendar,
  Wallet,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ReceiptText,
  Search,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BayarKasbonDialog } from "@/components/pos/bayar-kasbon-dialog";
import { ReceiptModal, ReceiptData } from "@/components/receipt-modal";
import { getKartuKasbon, deleteKasbon } from "@/app/actions/kasbon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function KasbonTable({
  initialData,
  summary,
}: {
  initialData: any[];
  summary: {
    totalPiutangAktif: number;
    jumlahPeminjamAktif: number;
    jumlahLewatJatuhTempo: number;
    totalSudahDilunasi: number;
    totalPeminjamTerdaftar: number;
  };
}) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<"SEMUA" | "BELUM_LUNAS" | "LUNAS">("BELUM_LUNAS");
  const [search, setSearch] = useState("");

  // Dialog Bayar Kasbon
  const [isBayarOpen, setIsBayarOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Modal Kartu Kasbon (Ledger Rinci)
  const [kartuKasbon, setKartuKasbon] = useState<any | null>(null);
  const [isKartuOpen, setIsKartuOpen] = useState(false);
  const [loadingKartu, setLoadingKartu] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter Client-side
  const filteredList = useMemo(() => {
    return initialData.filter((k) => {
      if (filterStatus === "BELUM_LUNAS" && k.saldoHutang <= 0) return false;
      if (filterStatus === "LUNAS" && k.saldoHutang > 0) return false;

      if (search.trim().length > 0) {
        const q = search.toLowerCase();
        const nama = (k.namaPelanggan || "").toLowerCase();
        const telp = (k.telepon || "").toLowerCase();
        const mbr = (k.member?.nama || "").toLowerCase();
        if (!nama.includes(q) && !telp.includes(q) && !mbr.includes(q)) return false;
      }

      return true;
    });
  }, [initialData, filterStatus, search]);

  const handleOpenKartu = async (kasbonId: string) => {
    setLoadingKartu(true);
    setIsKartuOpen(true);
    try {
      const data = await getKartuKasbon(kasbonId);
      setKartuKasbon(data);
    } catch (e: any) {
      toast.error(e.message || "Gagal memuat kartu kasbon.");
      setIsKartuOpen(false);
    } finally {
      setLoadingKartu(false);
    }
  };

  const handleDeleteKasbon = async (kasbonId: string, nama: string) => {
    if (!confirm(`Hapus akun kasbon "${nama}"?`)) return;
    try {
      await deleteKasbon(kasbonId);
      toast.success(`Akun kasbon "${nama}" berhasil dihapus.`);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Gagal menghapus akun kasbon.");
    }
  };

  const formatWAUrl = (telepon: string | null, nama: string, saldo: number) => {
    if (!telepon) return "#";
    let clean = telepon.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.slice(1);
    }
    const message = encodeURIComponent(
      `Halo ${nama}, kami dari kasir menginformasikan catatan saldo kasbon Anda saat ini sebesar Rp ${saldo.toLocaleString(
        "id-ID"
      )}. Terima kasih atas kerja samanya!`
    );
    return `https://wa.me/${clean}?text=${message}`;
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "namaPelanggan",
      header: "Nama Pelanggan",
      cell: ({ row }) => {
        const k = row.original;
        return (
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded-full">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{k.namaPelanggan}</p>
              {k.member ? (
                <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded">
                  Member: {k.member.kode}
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Non-Member</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "telepon",
      header: "Kontak / WA",
      cell: ({ row }) => {
        const telp = row.original.telepon;
        const nama = row.original.namaPelanggan;
        const saldo = row.original.saldoHutang;

        if (!telp) return <span className="text-muted-foreground text-xs">-</span>;

        return (
          <div className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-mono">{telp}</span>
            {saldo > 0 && (
              <a
                href={formatWAUrl(telp, nama, saldo)}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50"
                title="Kirim pengingat saldo kasbon via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "totalHutang",
      header: "Total Belanja Kasbon",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          Rp {row.original.totalHutang.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "totalBayar",
      header: "Sudah Dibayar",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-emerald-600 font-semibold">
          Rp {row.original.totalBayar.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      accessorKey: "saldoHutang",
      header: "Saldo Hutang Aktif",
      cell: ({ row }) => {
        const saldo = row.original.saldoHutang;
        return (
          <div className="flex flex-col">
            <span
              className={`font-mono font-bold text-sm ${
                saldo > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"
              }`}
            >
              Rp {saldo.toLocaleString("id-ID")}
            </span>
            {saldo === 0 && (
              <Badge variant="outline" className="text-[9px] w-fit py-0 border-emerald-400 text-emerald-600 bg-emerald-50">
                Lunas
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "jatuhTempo",
      header: "Jatuh Tempo",
      cell: ({ row }) => {
        const jt = row.original.jatuhTempo;
        const saldo = row.original.saldoHutang;

        if (!jt) {
          return <span className="text-muted-foreground text-xs italic">-</span>;
        }

        const date = new Date(jt);
        const jtStr = date.toISOString().slice(0, 10);
        const isLate = saldo > 0 && jtStr < todayStr;

        return (
          <div className="flex items-center gap-1">
            <span
              className={`text-xs font-mono font-medium ${
                isLate ? "text-destructive font-bold" : "text-muted-foreground"
              }`}
            >
              {date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {isLate && (
              <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold">
                Lewat
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const k = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenKartu(k.id)}
              className="h-8 text-xs gap-1 font-medium"
              title="Lihat riwayat buku besar kasbon"
            >
              <ReceiptText className="w-3.5 h-3.5 text-primary" /> Kartu Kasbon
            </Button>

            {k.saldoHutang > 0 ? (
              <Button
                size="sm"
                onClick={() => setIsBayarOpen(true)}
                className="h-8 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                title="Catat pembayaran cicilan atau pelunasan"
              >
                <Wallet className="w-3.5 h-3.5" /> Bayar
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDeleteKasbon(k.id, k.namaPelanggan)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Hapus akun kasbon (hanya jika lunas)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Piutang Aktif
              </p>
              <p className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                Rp {summary.totalPiutangAktif.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 shrink-0">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Peminjam Aktif
              </p>
              <p className="text-lg sm:text-2xl font-black text-foreground font-mono mt-0.5">
                {summary.jumlahPeminjamAktif}
                <span className="text-xs font-normal text-muted-foreground ml-1">Orang</span>
              </p>
            </div>
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shrink-0">
              <User className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Lewat Jatuh Tempo
              </p>
              <p className="text-lg sm:text-2xl font-black text-destructive font-mono mt-0.5">
                {summary.jumlahLewatJatuhTempo}
                <span className="text-xs font-normal text-muted-foreground ml-1">Orang</span>
              </p>
            </div>
            <div className="bg-destructive/10 p-2.5 rounded-xl text-destructive shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs bg-card">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Dilunasi
              </p>
              <p className="text-lg sm:text-2xl font-black text-emerald-600 font-mono mt-0.5">
                Rp {summary.totalSudahDilunasi.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2.5 rounded-xl text-emerald-600 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar Filter & Pencarian */}
      <Card className="shadow-xs border bg-card">
        <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(
              [
                { key: "BELUM_LUNAS", label: "Belum Lunas" },
                { key: "LUNAS", label: "Lunas" },
                { key: "SEMUA", label: "Semua Akun" },
              ] as const
            ).map((st) => (
              <Button
                key={st.key}
                variant={filterStatus === st.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(st.key)}
                className="h-8 px-3 text-xs font-semibold"
              >
                {st.label}
              </Button>
            ))}
          </div>

          {/* Search & Bayar Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari nama atau no. telp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>

            <Button
              onClick={() => setIsBayarOpen(true)}
              className="h-8 text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5" /> Catat Pembayaran
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabel Data Kasbon */}
      <DataTable columns={columns} data={filteredList} />

      {/* Modal Dialog Bayar Kasbon Langsung */}
      <BayarKasbonDialog
        open={isBayarOpen}
        onOpenChange={setIsBayarOpen}
        onPaymentSuccess={(receipt) => {
          setSelectedReceipt(receipt);
          setIsReceiptOpen(true);
          router.refresh();
        }}
      />

      {/* Modal Cetak Struk Bukti Pembayaran */}
      <ReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={selectedReceipt}
        onNewTransaction={() => setIsReceiptOpen(false)}
      />

      {/* Modal Kartu Kasbon (Ledger Rinci Belanja & Pembayaran) */}
      <Dialog open={isKartuOpen} onOpenChange={setIsKartuOpen}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <ReceiptText className="w-5 h-5 text-primary" />
                Kartu Kasbon: {kartuKasbon?.namaPelanggan || "Memuat..."}
              </div>
              {kartuKasbon && (
                <span className="font-mono font-black text-amber-600 text-base">
                  Saldo: Rp {kartuKasbon.saldoHutang.toLocaleString("id-ID")}
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Buku besar kronologis seluruh penambahan hutang dan riwayat pembayaran cicilan/lunas.
            </DialogDescription>
          </DialogHeader>

          {loadingKartu || !kartuKasbon ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Memuat data buku kasbon...
            </div>
          ) : (
            <Tabs defaultValue="transaksi" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="transaksi" className="text-xs font-bold">
                  Belanja Hutang ({kartuKasbon.transaksiBelanja?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="pembayaran" className="text-xs font-bold">
                  Riwayat Cicilan ({kartuKasbon.riwayatPembayaran?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Daftar Belanja Penambah Hutang */}
              <TabsContent value="transaksi" className="space-y-2 mt-3">
                <div className="max-h-[50vh] overflow-y-auto border rounded-xl divide-y text-xs">
                  {(kartuKasbon.transaksiBelanja?.length || 0) === 0 ? (
                    <p className="p-4 text-center text-muted-foreground">
                      Belum ada transaksi belanja yang menambah hutang.
                    </p>
                  ) : (
                    kartuKasbon.transaksiBelanja.map((tx: any) => (
                      <div key={tx.id} className="p-3 hover:bg-muted/40 transition-colors space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-bold text-foreground">{tx.invoice}</span>
                            <p className="text-[10.5px] text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-amber-600 font-mono text-sm">
                              +Rp {(tx.tambahHutang || tx.total).toLocaleString("id-ID")}
                            </span>
                            <p className="text-[10px] text-muted-foreground">
                              Total Faktur: Rp {tx.total.toLocaleString("id-ID")}
                              {tx.bayar > 0 && ` (DP: Rp ${tx.bayar.toLocaleString("id-ID")})`}
                            </p>
                          </div>
                        </div>

                        {/* Rincian Item Barang */}
                        <div className="bg-muted/30 p-2 rounded-lg text-[11px] space-y-0.5">
                          {tx.items?.map((it: any) => (
                            <div key={it.id} className="flex justify-between text-muted-foreground">
                              <span>
                                {it.qty} {it.varian?.unit?.name || "Pcs"} • {it.barang?.nama}
                              </span>
                              <span className="font-mono">Rp {it.subtotal.toLocaleString("id-ID")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Tab 2: Riwayat Pembayaran Cicilan */}
              <TabsContent value="pembayaran" className="space-y-2 mt-3">
                <div className="max-h-[50vh] overflow-y-auto border rounded-xl divide-y text-xs">
                  {(kartuKasbon.riwayatPembayaran?.length || 0) === 0 ? (
                    <p className="p-4 text-center text-muted-foreground">
                      Belum ada riwayat pembayaran cicilan.
                    </p>
                  ) : (
                    kartuKasbon.riwayatPembayaran.map((rw: any) => (
                      <div key={rw.id} className="p-3 hover:bg-muted/40 transition-colors space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-foreground">{rw.noPembayaran}</span>
                              <Badge variant="outline" className="text-[9px] py-0 font-bold uppercase">
                                {rw.metode}
                              </Badge>
                            </div>
                            <p className="text-[10.5px] text-muted-foreground">
                              {new Date(rw.createdAt).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-600 font-mono text-sm">
                              -Rp {rw.jumlahBayar.toLocaleString("id-ID")}
                            </span>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Sisa: Rp {rw.saldoSesudah.toLocaleString("id-ID")}
                            </p>
                          </div>
                        </div>

                        {rw.catatan && (
                          <p className="text-[10.5px] text-muted-foreground italic">
                            Catatan: {rw.catatan}
                          </p>
                        )}
                        {rw.referensi && (
                          <p className="text-[10px] font-mono text-muted-foreground">
                            Ref: {rw.referensi}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
