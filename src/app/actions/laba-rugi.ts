"use server";

import { db } from "@/lib/db";

export interface LabaRugiFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface ProductProfitSummary {
  barangId: string;
  kode: string;
  nama: string;
  kategori: string;
  qtySold: number; // total in pcs
  omset: number;
  hpp: number;
  labaKotor: number;
  marginPercent: number;
}

export interface DailyProfitSummary {
  date: string;
  omset: number;
  hpp: number;
  labaKotor: number;
  kerugianOpname: number;
  labaBersih: number;
  transaksiCount: number;
}

export interface LabaRugiReportData {
  period: {
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: {
    totalOmset: number;
    totalHpp: number;
    labaKotor: number;
    marginKotorPercent: number;
    totalKerugianOpname: number;
    totalKoreksiTambahOpname: number;
    labaBersih: number;
    marginBersihPercent: number;
    totalTransaksi: number;
    totalItemTerjual: number;
  };
  dailyTrend: DailyProfitSummary[];
  productBreakdown: ProductProfitSummary[];
}

export async function getLaporanLabaRugi(filter?: LabaRugiFilter): Promise<LabaRugiReportData> {
  const now = new Date();

  // Default to current month (1st of month to today)
  let start = filter?.startDate
    ? new Date(`${filter.startDate}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  let end = filter?.endDate
    ? new Date(`${filter.endDate}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (start > end) {
    const temp = start;
    start = end;
    end = temp;
  }

  const startDateStr = start.toISOString().slice(0, 10);
  const endDateStr = end.toISOString().slice(0, 10);

  // 1. Ambil transaksi aktif (bukan BATAL) beserta item dan relasi barang & variannya
  const transactions = await db.transaksi.findMany({
    where: {
      status: { not: "BATAL" },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: {
        include: {
          barang: {
            include: {
              kategori: true,
            },
          },
          varian: {
            include: {
              unit: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 2. Ambil dokumen Stok Opname pada periode yang sama
  const opnames = await db.stokOpname.findMany({
    where: {
      tanggal: {
        gte: start,
        lte: end,
      },
    },
    include: {
      items: true,
    },
  });

  // Inisialisasi peta harian
  const dailyMap = new Map<string, DailyProfitSummary>();

  // Buat slot hari dari start sampai end
  const curDate = new Date(start);
  while (curDate <= end) {
    const dStr = curDate.toISOString().slice(0, 10);
    dailyMap.set(dStr, {
      date: dStr,
      omset: 0,
      hpp: 0,
      labaKotor: 0,
      kerugianOpname: 0,
      labaBersih: 0,
      transaksiCount: 0,
    });
    curDate.setDate(curDate.getDate() + 1);
  }

  let totalOmset = 0;
  let totalHpp = 0;
  let totalItemTerjual = 0;

  // Peta produk untuk breakdown
  const productMap = new Map<string, ProductProfitSummary>();

  // Proses transaksi
  for (const tx of transactions) {
    const txDateStr = new Date(tx.createdAt).toISOString().slice(0, 10);
    const dayStat = dailyMap.get(txDateStr);
    if (dayStat) {
      dayStat.transaksiCount += 1;
    }

    for (const item of tx.items) {
      const konversi = item.varian?.konversi || 1;
      const totalPcs = item.qty * konversi;
      const hargaBeli = item.barang?.hargaBeli || 0;
      const hpp = totalPcs * hargaBeli;
      const omset = item.subtotal;
      const labaKotor = omset - hpp;

      totalOmset += omset;
      totalHpp += hpp;
      totalItemTerjual += totalPcs;

      if (dayStat) {
        dayStat.omset += omset;
        dayStat.hpp += hpp;
        dayStat.labaKotor += labaKotor;
      }

      // Agregasi per produk
      const bId = item.barangId;
      const existingProduct = productMap.get(bId);
      if (existingProduct) {
        existingProduct.qtySold += totalPcs;
        existingProduct.omset += omset;
        existingProduct.hpp += hpp;
        existingProduct.labaKotor += labaKotor;
      } else {
        productMap.set(bId, {
          barangId: bId,
          kode: item.barang?.kode || "-",
          nama: item.barang?.nama || "Produk",
          kategori: item.barang?.kategori?.nama || "Umum",
          qtySold: totalPcs,
          omset,
          hpp,
          labaKotor,
          marginPercent: 0,
        });
      }
    }

    // Koreksi diskon tingkat transaksi pada omset harian dan total omset
    const txDiskon = tx.diskonNominal || 0;
    if (txDiskon > 0) {
      totalOmset -= txDiskon;
      if (dayStat) {
        dayStat.omset -= txDiskon;
        dayStat.labaKotor -= txDiskon;
      }
    }
  }

  // Hitung margin persentase produk
  const productBreakdown = Array.from(productMap.values()).map((p) => {
    const margin = p.omset > 0 ? (p.labaKotor / p.omset) * 100 : 0;
    return {
      ...p,
      marginPercent: Math.round(margin * 10) / 10,
    };
  });

  // Urutkan produk berdasarkan laba kotor tertinggi
  productBreakdown.sort((a, b) => b.labaKotor - a.labaKotor);

  // Proses kerugian dan koreksi stok opname
  let totalKerugianOpname = 0;
  let totalKoreksiTambahOpname = 0;

  for (const op of opnames) {
    const opDateStr = new Date(op.tanggal).toISOString().slice(0, 10);
    const dayStat = dailyMap.get(opDateStr);

    for (const item of op.items) {
      if (item.nilaiSelisih < 0) {
        const loss = Math.abs(item.nilaiSelisih);
        totalKerugianOpname += loss;
        if (dayStat) {
          dayStat.kerugianOpname += loss;
        }
      } else if (item.nilaiSelisih > 0) {
        totalKoreksiTambahOpname += item.nilaiSelisih;
      }
    }
  }

  // Hitung laba bersih harian pada dailyMap
  dailyMap.forEach((day) => {
    day.labaBersih = day.labaKotor - day.kerugianOpname;
  });

  const labaKotor = totalOmset - totalHpp;
  const marginKotorPercent = totalOmset > 0 ? Math.round((labaKotor / totalOmset) * 1000) / 10 : 0;
  const labaBersih = labaKotor - totalKerugianOpname + totalKoreksiTambahOpname;
  const marginBersihPercent = totalOmset > 0 ? Math.round((labaBersih / totalOmset) * 1000) / 10 : 0;

  const startFormatted = start.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const endFormatted = end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return {
    period: {
      startDate: startDateStr,
      endDate: endDateStr,
      label: `${startFormatted} s/d ${endFormatted}`,
    },
    summary: {
      totalOmset,
      totalHpp,
      labaKotor,
      marginKotorPercent,
      totalKerugianOpname,
      totalKoreksiTambahOpname,
      labaBersih,
      marginBersihPercent,
      totalTransaksi: transactions.length,
      totalItemTerjual,
    },
    dailyTrend: Array.from(dailyMap.values()),
    productBreakdown,
  };
}
