"use server";

import { db } from "@/lib/db";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface OperasionalFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  kategori?: string;  // "SEMUA" | "LISTRIK_AIR" | ...
}

export async function getBiayaOperasional(filter?: OperasionalFilter) {
  await requireRole(["OWNER"]);

  const whereClause: any = {};

  if (filter?.startDate || filter?.endDate) {
    whereClause.tanggal = {};
    if (filter.startDate) {
      whereClause.tanggal.gte = new Date(`${filter.startDate}T00:00:00`);
    }
    if (filter.endDate) {
      whereClause.tanggal.lte = new Date(`${filter.endDate}T23:59:59.999`);
    }
  }

  if (filter?.kategori && filter.kategori !== "SEMUA") {
    whereClause.kategori = filter.kategori;
  }

  const list = await db.biayaOperasional.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      user: {
        select: {
          id: true,
          nama: true,
          username: true,
        },
      },
    },
    orderBy: {
      tanggal: "desc",
    },
  });

  // Hitung KPI
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalPengeluaranFilter = 0;
  let totalHariIni = 0;
  let totalBulanIni = 0;

  const kategoriBreakdown: Record<string, number> = {};

  for (const item of list) {
    totalPengeluaranFilter += item.jumlah;

    const tglStr = new Date(item.tanggal).toISOString().slice(0, 10);
    if (tglStr === todayStr) {
      totalHariIni += item.jumlah;
    }

    if (new Date(item.tanggal) >= startOfMonth) {
      totalBulanIni += item.jumlah;
    }

    kategoriBreakdown[item.kategori] = (kategoriBreakdown[item.kategori] || 0) + item.jumlah;
  }

  return {
    list,
    summary: {
      totalPengeluaranFilter,
      totalHariIni,
      totalBulanIni,
      transaksiCount: list.length,
      kategoriBreakdown,
    },
  };
}

export async function createBiayaOperasional(payload: {
  tanggal?: string | Date;
  kategori: string;
  nama: string;
  jumlah: number;
  metode?: string;
  catatan?: string;
}) {
  const user = await requireRole(["OWNER"]);

  const { tanggal, kategori, nama, jumlah, metode = "TUNAI", catatan } = payload;

  if (!kategori || !nama || !jumlah) {
    throw new Error("Kategori, Deskripsi Nama Biaya, dan Jumlah pengeluaran wajib diisi.");
  }

  const nominal = Number(jumlah);
  if (nominal <= 0) {
    throw new Error("Jumlah pengeluaran harus lebih dari Rp 0.");
  }

  const result = await db.biayaOperasional.create({
    data: {
      tanggal: tanggal ? new Date(tanggal) : new Date(),
      kategori,
      nama: nama.trim(),
      jumlah: nominal,
      metode,
      catatan: catatan ? catatan.trim() : null,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard/operasional");
  revalidatePath("/dashboard/laba-rugi");
  return { success: true, id: result.id };
}

export async function updateBiayaOperasional(
  id: string,
  payload: {
    tanggal?: string | Date;
    kategori?: string;
    nama?: string;
    jumlah?: number;
    metode?: string;
    catatan?: string;
  }
) {
  await requireRole(["OWNER"]);

  const data: any = {};
  if (payload.tanggal !== undefined) data.tanggal = new Date(payload.tanggal);
  if (payload.kategori !== undefined) data.kategori = payload.kategori;
  if (payload.nama !== undefined) data.nama = payload.nama.trim();
  if (payload.jumlah !== undefined) data.jumlah = Number(payload.jumlah);
  if (payload.metode !== undefined) data.metode = payload.metode;
  if (payload.catatan !== undefined) data.catatan = payload.catatan ? payload.catatan.trim() : null;

  const result = await db.biayaOperasional.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/operasional");
  revalidatePath("/dashboard/laba-rugi");
  return { success: true, id: result.id };
}

export async function deleteBiayaOperasional(id: string) {
  await requireRole(["OWNER"]);

  await db.biayaOperasional.delete({
    where: { id },
  });

  revalidatePath("/dashboard/operasional");
  revalidatePath("/dashboard/laba-rugi");
  return { success: true };
}
