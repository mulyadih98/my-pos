"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Package } from "lucide-react";
import Link from "next/link";

interface TopProductItem {
  id: string;
  nama: string;
  kategori: string;
  totalSold: number;
  totalRevenue: number;
  stok: number;
}

interface TopProductsProps {
  products: TopProductItem[];
}

export function TopProducts({ products }: TopProductsProps) {
  const maxSold = products.length > 0 ? Math.max(...products.map((p) => p.totalSold)) : 1;

  return (
    <Card className="shadow-sm flex flex-col">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Produk Terlaris (Best Seller)
          </CardTitle>
          <Link
            href="/dashboard/barang"
            className="text-xs text-primary hover:underline font-medium"
          >
            Lihat Semua &rarr;
          </Link>
        </div>
        <CardDescription className="text-xs">
          5 produk dengan kuantitas penjualan tertinggi
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 flex-1">
        {products.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <Package className="w-8 h-8 stroke-1" />
            <p>Belum ada data penjualan tercatat.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((item, index) => {
              const percent = maxSold > 0 ? Math.round((item.totalSold / maxSold) * 100) : 0;
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          index === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                            : index === 1
                            ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            : index === 2
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold truncate text-foreground">{item.nama}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                        {item.kategori}
                      </Badge>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-foreground">{item.totalSold} terjual</span>
                      <span className="text-[10px] text-muted-foreground block">
                        Rp {item.totalRevenue.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
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
