"use server";

import { db } from "@/lib/db";

export async function getDashboardStats() {
  const now = new Date();

  // Start of Today (00:00:00)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Start of Yesterday
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const endOfYesterday = new Date(endOfToday);
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);

  // Start of Current Month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  // 1. Transactions Today
  const todayTransactions = await db.transaksi.findMany({
    where: {
      createdAt: {
        gte: startOfToday,
        lte: endOfToday,
      },
    },
    select: {
      total: true,
    },
  });

  const todayRevenue = todayTransactions.reduce((acc, t) => acc + t.total, 0);
  const todayTxCount = todayTransactions.length;

  // 2. Transactions Yesterday (for growth calculation)
  const yesterdayTransactions = await db.transaksi.findMany({
    where: {
      createdAt: {
        gte: startOfYesterday,
        lte: endOfYesterday,
      },
    },
    select: {
      total: true,
    },
  });
  const yesterdayRevenue = yesterdayTransactions.reduce((acc, t) => acc + t.total, 0);

  // 3. Transactions Month
  const monthTransactions = await db.transaksi.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
    select: {
      total: true,
    },
  });
  const monthRevenue = monthTransactions.reduce((acc, t) => acc + t.total, 0);

  // 4. Low Stock Products (stok <= 5)
  const lowStockItems = await db.barang.findMany({
    where: {
      stok: {
        lte: 5,
      },
    },
    include: {
      supplier: true,
      varians: {
        include: { unit: true },
      },
    },
    orderBy: {
      stok: "asc",
    },
    take: 6,
  });

  const lowStockCount = await db.barang.count({
    where: {
      stok: {
        lte: 5,
      },
    },
  });

  // 5. Total Members
  const totalMembers = await db.member.count();

  // 6. Active Promos
  const activePromoCount = await db.promo.count({
    where: {
      isActive: true,
      tanggalMulai: { lte: now },
      tanggalSelesai: { gte: now },
    },
  });

  // 7. Recent 5 Transactions
  const recentTransactions = await db.transaksi.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      member: true,
      items: {
        include: {
          barang: true,
        },
      },
    },
  });

  // 8. Top Selling Products (Aggregated by ItemTransaksi quantity)
  const topItemsRaw = await db.itemTransaksi.groupBy({
    by: ["barangId"],
    _sum: {
      qty: true,
      subtotal: true,
    },
    orderBy: {
      _sum: {
        qty: "desc",
      },
    },
    take: 5,
  });

  // Fetch product names for top items
  const topProducts = await Promise.all(
    topItemsRaw.map(async (item) => {
      const product = await db.barang.findUnique({
        where: { id: item.barangId },
        include: {
          kategori: true,
        },
      });
      return {
        id: item.barangId,
        nama: product?.nama || "Produk Tidak Dikenal",
        kategori: product?.kategori?.nama || "Umum",
        totalSold: item._sum.qty || 0,
        totalRevenue: item._sum.subtotal || 0,
        stok: product?.stok || 0,
      };
    })
  );

  return {
    todayRevenue,
    todayTxCount,
    yesterdayRevenue,
    monthRevenue,
    lowStockCount,
    lowStockItems,
    totalMembers,
    activePromoCount,
    recentTransactions,
    topProducts,
  };
}

export async function getSalesChartData(days: number = 90) {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const transactions = await db.transaksi.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group transactions by date YYYY-MM-DD
  const dateMap: { [key: string]: { revenue: number; count: number } } = {};

  // Initialize all days in range with 0
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    dateMap[dateKey] = { revenue: 0, count: 0 };
  }

  // Populate from transactions
  transactions.forEach((tx) => {
    const dateKey = new Date(tx.createdAt).toISOString().slice(0, 10);
    if (dateMap[dateKey]) {
      dateMap[dateKey].revenue += tx.total;
      dateMap[dateKey].count += 1;
    }
  });

  return Object.keys(dateMap).map((date) => ({
    date,
    revenue: dateMap[date].revenue,
    transactions: dateMap[date].count,
  }));
}
