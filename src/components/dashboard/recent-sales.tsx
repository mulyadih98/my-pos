"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight, Receipt } from "lucide-react";
import Link from "next/link";

interface RecentTransaction {
  id: string;
  invoice: string;
  total: number;
  createdAt: Date;
  member?: {
    nama: string;
  } | null;
  items: any[];
}

interface RecentSalesProps {
  transactions: RecentTransaction[];
}

export function RecentSales({ transactions }: RecentSalesProps) {
  return (
    <Card className="shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" /> Transaksi Terkini
          </CardTitle>
          <Link
            href="/dashboard/riwayat"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            Lihat Riwayat <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          5 transaksi penjualan terbaru yang tercatat di kasir
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3 flex-1">
        {transactions.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <Receipt className="w-8 h-8 stroke-1" />
            <p>Belum ada transaksi penjualan.</p>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => {
              const time = new Date(tx.createdAt).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const date = new Date(tx.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });

              return (
                <div key={tx.id} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-foreground">
                        {tx.invoice}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1.5 py-0 h-4 font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        Lunas
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span>{tx.member?.nama || "Pelanggan Umum"}</span>
                      <span>•</span>
                      <span>
                        {date}, {time}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-primary block">
                      Rp {tx.total.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tx.items.length} item
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
