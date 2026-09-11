import { getDashboardStats, getSalesChartData } from "@/app/actions/dashboard";
import { StatCards } from "@/components/dashboard/stat-cards";
import { DashboardChart } from "@/components/dashboard/dashboard-chart";
import { TopProducts } from "@/components/dashboard/top-products";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { LowStockAlert } from "@/components/dashboard/low-stock-alert";
import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const [stats, chartData] = await Promise.all([
    getDashboardStats(),
    getSalesChartData(90),
  ]);

  const todayStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Dashboard Penjualan <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan performa penjualan, omset, dan inventori toko per {todayStr}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/transaksi">
            <Button className="gap-2 font-bold shadow-sm">
              <CreditCard className="w-4 h-4" /> Buka Kasir (POS)
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Stat Cards (KPI) */}
      <StatCards
        todayRevenue={stats.todayRevenue}
        monthRevenue={stats.monthRevenue}
        todayTxCount={stats.todayTxCount}
        lowStockCount={stats.lowStockCount}
        totalMembers={stats.totalMembers}
        activePromoCount={stats.activePromoCount}
      />

      {/* 2. Interactive Sales Trend Chart */}
      <DashboardChart data={chartData} />

      {/* 3. Two Columns: Top Products & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <TopProducts products={stats.topProducts} />
        </div>
        <div className="lg:col-span-6">
          <RecentSales transactions={stats.recentTransactions} />
        </div>
      </div>

      {/* 4. Low Stock Alerts */}
      <LowStockAlert items={stats.lowStockItems} totalCount={stats.lowStockCount} />
    </div>
  );
}
