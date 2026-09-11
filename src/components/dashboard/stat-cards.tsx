"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, AlertTriangle, Users, Gift, TrendingUp } from "lucide-react";

interface StatCardsProps {
  todayRevenue: number;
  monthRevenue: number;
  todayTxCount: number;
  lowStockCount: number;
  totalMembers: number;
  activePromoCount: number;
}

export function StatCards({
  todayRevenue,
  monthRevenue,
  todayTxCount,
  lowStockCount,
  totalMembers,
  activePromoCount,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Omset Hari Ini */}
      <Card className="border-l-4 border-l-primary bg-gradient-to-br from-primary/5 via-card to-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Omset Hari Ini
          </CardTitle>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            Rp {todayRevenue.toLocaleString("id-ID")}
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" /> Bulan ini:{" "}
            <span className="font-semibold text-foreground">
              Rp {monthRevenue.toLocaleString("id-ID")}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* 2. Transaksi Hari Ini */}
      <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 via-card to-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Transaksi Hari Ini
          </CardTitle>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Receipt className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {todayTxCount} <span className="text-sm font-normal text-muted-foreground">Struk</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Penjualan kasir tercatat hari ini</p>
        </CardContent>
      </Card>

      {/* 3. Peringatan Stok Menipis */}
      <Card
        className={`border-l-4 shadow-sm ${
          lowStockCount > 0
            ? "border-l-amber-500 bg-gradient-to-br from-amber-500/10 via-card to-card"
            : "border-l-emerald-500 bg-gradient-to-br from-emerald-500/5 via-card to-card"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Peringatan Stok Menipis
          </CardTitle>
          <div
            className={`p-2 rounded-lg ${
              lowStockCount > 0
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-emerald-500/10 text-emerald-600"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold flex items-center gap-2">
            <span className={lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
              {lowStockCount}
            </span>
            <span className="text-sm font-normal text-muted-foreground">Produk</span>
            {lowStockCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5 font-bold">
                Perlu Order
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">Barang dengan sisa stok &le; 5 unit</p>
        </CardContent>
      </Card>

      {/* 4. Member & Promo Aktif */}
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/5 via-card to-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Member & Promo Aktif
          </CardTitle>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Users className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="text-2xl font-bold text-foreground">
            {totalMembers} <span className="text-sm font-normal text-muted-foreground">Member</span>
          </div>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Gift className="w-3 h-3 text-purple-500" />
            <span>
              <strong className="text-foreground font-semibold">{activePromoCount}</strong> Program
              promo berjalan
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
