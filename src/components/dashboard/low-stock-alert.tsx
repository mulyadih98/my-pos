"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PackageCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LowStockItem {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  supplier?: {
    nama: string;
    telepon?: string | null;
  } | null;
  varians: {
    unit: {
      name: string;
    };
  }[];
}

interface LowStockAlertProps {
  items: LowStockItem[];
  totalCount: number;
}

export function LowStockAlert({ items, totalCount }: LowStockAlertProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Peringatan Re-Stock Inventori
          </CardTitle>
          <Link
            href="/dashboard/barang"
            className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
          >
            Kelola Stok ({totalCount}) <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <CardDescription className="text-xs">
          Produk dengan sisa stok kritis (&le; 5 unit) yang perlu segera diorder ke supplier
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <div className="h-28 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1.5">
            <PackageCheck className="w-7 h-7 text-emerald-500" />
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Semua stok aman! Tidak ada barang yang menipis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => {
              const unitName = item.varians[0]?.unit?.name || "Pcs";
              const isCriticallyLow = item.stok === 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between space-y-2 ${
                    isCriticallyLow
                      ? "bg-red-500/5 border-red-500/30 dark:bg-red-950/20"
                      : "bg-amber-500/5 border-amber-500/30 dark:bg-amber-950/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-xs text-foreground line-clamp-1">
                        {item.nama}
                      </p>
                      <Badge
                        variant={isCriticallyLow ? "destructive" : "outline"}
                        className={`text-[10px] px-1.5 py-0 h-4 shrink-0 font-bold ${
                          !isCriticallyLow
                            ? "text-amber-700 dark:text-amber-400 border-amber-400/50"
                            : ""
                        }`}
                      >
                        {isCriticallyLow ? "HABIS" : `Sisa ${item.stok} ${unitName}`}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">Kode: {item.kode}</p>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Supplier: {item.supplier?.nama || "-"}</span>
                    {item.supplier?.telepon && (
                      <span className="font-mono text-[10px]">{item.supplier.telepon}</span>
                    )}
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
