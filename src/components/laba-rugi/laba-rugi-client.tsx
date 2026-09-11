"use client";

import { useState, useTransition, useMemo } from "react";
import {
  LabaRugiReportData,
  getLaporanLabaRugi,
  ProductProfitSummary,
} from "@/app/actions/laba-rugi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Printer,
  Download,
  Search,
  Filter,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { toast } from "sonner";

interface LabaRugiClientProps {
  initialData: LabaRugiReportData;
}

export function LabaRugiClient({ initialData }: LabaRugiClientProps) {
  const [data, setData] = useState<LabaRugiReportData>(initialData);
  const [startDate, setStartDate] = useState(initialData.period.startDate);
  const [endDate, setEndDate] = useState(initialData.period.endDate);
  const [activePreset, setActivePreset] = useState<string>("this_month");
  const [searchProduct, setSearchProduct] = useState("");
  const [isPending, startTransition] = useTransition();

  // Handle Preset Klik
  const handlePreset = (preset: "today" | "7d" | "this_month" | "last_month") => {
    setActivePreset(preset);
    const now = new Date();
    let s = "";
    let e = "";

    if (preset === "today") {
      s = now.toISOString().slice(0, 10);
      e = s;
    } else if (preset === "7d") {
      const d = new Date();
      d.setDate(now.getDate() - 6);
      s = d.toISOString().slice(0, 10);
      e = now.toISOString().slice(0, 10);
    } else if (preset === "this_month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      e = now.toISOString().slice(0, 10);
    } else if (preset === "last_month") {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      s = firstDayLastMonth.toISOString().slice(0, 10);
      e = lastDayLastMonth.toISOString().slice(0, 10);
    }

    setStartDate(s);
    setEndDate(e);

    startTransition(async () => {
      try {
        const res = await getLaporanLabaRugi({ startDate: s, endDate: e });
        setData(res);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat laporan");
      }
    });
  };

  // Submit Filter Kustom Tanggal
  const handleFilterCustom = () => {
    if (!startDate || !endDate) {
      toast.error("Pilih tanggal awal dan akhir.");
      return;
    }
    setActivePreset("custom");
    startTransition(async () => {
      try {
        const res = await getLaporanLabaRugi({ startDate, endDate });
        setData(res);
        toast.success(`Laporan diperbarui untuk periode ${res.period.label}`);
      } catch (err: any) {
        toast.error(err.message || "Gagal memuat laporan");
      }
    });
  };

  // Filter tabel produk
  const filteredProducts = useMemo(() => {
    if (!searchProduct.trim()) return data.productBreakdown;
    const q = searchProduct.toLowerCase();
    return data.productBreakdown.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q) || p.kategori.toLowerCase().includes(q)
    );
  }, [data.productBreakdown, searchProduct]);

  // Ekspor CSV
  const handleExportCSV = () => {
    const headers = ["Kode", "Nama Produk", "Kategori", "Qty Terjual", "Omset (Rp)", "HPP / Modal (Rp)", "Laba Kotor (Rp)", "Margin (%)"];
    const rows = data.productBreakdown.map((p) => [
      `"${p.kode}"`,
      `"${p.nama.replace(/"/g, '""')}"`,
      `"${p.kategori}"`,
      p.qtySold,
      p.omset,
      p.hpp,
      p.labaKotor,
      `${p.marginPercent}%`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laba_Rugi_${data.period.startDate}_sd_${data.period.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan berhasil diunduh dalam format CSV!");
  };

  // Cetak Dokumen Laporan
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header & Filter Bar (Hidden saat Print) */}
      <div className="print:hidden space-y-4">
        {/* Row 1: Presets & Print Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant={activePreset === "today" ? "default" : "outline"}
              onClick={() => handlePreset("today")}
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              Hari Ini
            </Button>
            <Button
              size="sm"
              variant={activePreset === "7d" ? "default" : "outline"}
              onClick={() => handlePreset("7d")}
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              7 Hari
            </Button>
            <Button
              size="sm"
              variant={activePreset === "this_month" ? "default" : "outline"}
              onClick={() => handlePreset("this_month")}
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              Bulan Ini
            </Button>
            <Button
              size="sm"
              variant={activePreset === "last_month" ? "default" : "outline"}
              onClick={() => handlePreset("last_month")}
              disabled={isPending}
              className="h-8 text-xs font-semibold"
            >
              Bulan Lalu
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportCSV}
              className="h-8 text-xs gap-1.5 font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Ekspor CSV
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 font-bold shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Laporan
            </Button>
          </div>
        </div>

        {/* Row 2: Custom Date Filter */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-xl border">
          <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-primary" /> Filter Tanggal:
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 text-xs bg-background w-36"
            />
            <span className="text-xs text-muted-foreground">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 text-xs bg-background w-36"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleFilterCustom}
            disabled={isPending}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Filter className="w-3 h-3" /> Terapkan
          </Button>

          <span className="text-xs text-muted-foreground ml-auto">
            Periode aktif: <strong className="text-foreground">{data.period.label}</strong>
          </span>
        </div>
      </div>

      {/* Printable Report Header (Visible saat Print) */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-black tracking-tight uppercase">LAPORAN LABA RUGI OPERASIONAL</h1>
        <p className="text-sm text-gray-600 mt-1">Periode: {data.period.label}</p>
        <p className="text-xs text-gray-500">Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
      </div>

      {/* 1. Stat Cards (KPI Ringkasan Keuangan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omset (Pendapatan Kotor) */}
        <Card className="border-l-4 border-l-blue-500 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Omset (Penjualan)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-foreground font-mono tracking-tight">
              Rp {data.summary.totalOmset.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {data.summary.totalTransaksi} transaksi ({data.summary.totalItemTerjual} pcs terjual)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: HPP / Modal Barang */}
        <Card className="border-l-4 border-l-amber-500 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Modal Barang (HPP)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-foreground font-mono tracking-tight">
              Rp {data.summary.totalHpp.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total harga beli modal barang yang telah terjual
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Laba Kotor (Gross Profit) */}
        <Card className="border-l-4 border-l-primary shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Laba Kotor (Gross)
            </CardTitle>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-primary font-mono tracking-tight">
              Rp {data.summary.labaKotor.toLocaleString("id-ID")}
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Badge variant="secondary" className="font-bold text-[10px] px-1.5 py-0">
                Margin: {data.summary.marginKotorPercent}%
              </Badge>
              <span className="text-muted-foreground">Omset - HPP</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Laba Bersih (Net Profit) */}
        <Card
          className={`border-l-4 shadow-xs ${
            data.summary.labaBersih >= 0
              ? "border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 to-card"
              : "border-l-red-500 bg-gradient-to-br from-red-500/5 to-card"
          }`}
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Laba Bersih Operasional
            </CardTitle>
            <div
              className={`p-1.5 rounded-lg ${
                data.summary.labaBersih >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
              }`}
            >
              {data.summary.labaBersih >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                data.summary.labaBersih >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {data.summary.labaBersih < 0 ? "-" : ""}Rp {Math.abs(data.summary.labaBersih).toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span>Margin Bersih: <strong>{data.summary.marginBersihPercent}%</strong></span>
              {data.summary.totalKerugianOpname > 0 && (
                <span className="text-red-500 font-semibold">(Opname: -Rp {data.summary.totalKerugianOpname.toLocaleString("id-ID")})</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Grafik Tren Laba Rugi Harian (Hidden saat print jika diinginkan, atau ditampilkan rapi) */}
      <Card className="shadow-xs print:break-inside-avoid">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Tren Harian: Omset vs Modal vs Laba
              </CardTitle>
              <CardDescription className="text-xs">
                Pergerakan omset harian, harga modal barang (HPP), dan laba kotor berjalan.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <ComposedChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const parts = val.split("-");
                    return `${parts[2]}/${parts[1]}`;
                  }}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                />
                <YAxis
                  tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={65}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `Rp ${Number(value).toLocaleString("id-ID")}`,
                    name === "omset" ? "Omset Penjualan" : name === "hpp" ? "Modal (HPP)" : "Laba Bersih",
                  ]}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{ backgroundColor: "var(--background)", borderRadius: "8px", border: "1px solid var(--border)" }}
                />
                <Legend
                  formatter={(value) => (value === "omset" ? "Omset" : value === "hpp" ? "Modal (HPP)" : "Laba Bersih")}
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                <Bar dataKey="omset" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="hpp" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Line type="monotone" dataKey="labaBersih" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tabel Rincian Keuntungan Per Barang */}
      <Card className="shadow-xs print:break-inside-avoid">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Rincian Laba per Produk
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar kontribusi omset, modal beli, margin persentase, dan nominal keuntungan bersih setiap barang.
            </CardDescription>
          </div>

          <div className="print:hidden relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 text-xs">
                  <TableHead className="py-2.5">No</TableHead>
                  <TableHead className="py-2.5">Produk</TableHead>
                  <TableHead className="py-2.5 hidden sm:table-cell">Kategori</TableHead>
                  <TableHead className="py-2.5 text-center">Qty Terjual</TableHead>
                  <TableHead className="py-2.5 text-right">Omset (Penjualan)</TableHead>
                  <TableHead className="py-2.5 text-right">Modal (HPP)</TableHead>
                  <TableHead className="py-2.5 text-right font-bold">Laba Kotor</TableHead>
                  <TableHead className="py-2.5 text-center font-bold">Margin %</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                      Tidak ada transaksi penjualan pada periode ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p, idx) => {
                    const isProfit = p.labaKotor > 0;
                    const isLoss = p.labaKotor < 0;

                    return (
                      <TableRow key={p.barangId} className="hover:bg-muted/20 text-xs transition-colors">
                        <TableCell className="py-2.5 text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="py-2.5">
                          <span className="font-semibold text-foreground block">{p.nama}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{p.kode}</span>
                        </TableCell>
                        <TableCell className="py-2.5 hidden sm:table-cell text-muted-foreground">{p.kategori}</TableCell>
                        <TableCell className="py-2.5 text-center font-semibold font-mono">
                          {p.qtySold} pcs
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono font-medium">
                          Rp {p.omset.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="py-2.5 text-right font-mono text-muted-foreground">
                          Rp {p.hpp.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell
                          className={`py-2.5 text-right font-mono font-black ${
                            isProfit ? "text-emerald-600 dark:text-emerald-400" : isLoss ? "text-red-600" : "text-foreground"
                          }`}
                        >
                          Rp {p.labaKotor.toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono inline-block ${
                              p.marginPercent >= 25
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : p.marginPercent > 0
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                                : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                            }`}
                          >
                            {p.marginPercent}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
