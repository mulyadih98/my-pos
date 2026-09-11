"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ItemStokOpnameInput {
  barangId: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  alasan: string; // "RUSAK", "KADALUARSA", "HILANG", "SELISIH_HITUNG", "LAINNYA"
  catatan?: string;
  hargaBeli: number;
  nilaiSelisih: number;
}

export interface CreateStokOpnameInput {
  kodeOpname: string;
  tanggal?: Date;
  keterangan?: string;
  items: ItemStokOpnameInput[];
}

/**
 * Mengambil riwayat seluruh dokumen stok opname
 */
export async function getStokOpnameList() {
  return await db.stokOpname.findMany({
    orderBy: {
      tanggal: "desc",
    },
    include: {
      items: {
        include: {
          barang: true,
        },
      },
    },
  });
}

/**
 * Mencatat dokumen stok opname baru & otomatis menyesuaikan stok master barang di database
 */
export async function createStokOpname(payload: CreateStokOpnameInput) {
  const { kodeOpname, tanggal, keterangan, items } = payload;

  if (!kodeOpname || !items || items.length === 0) {
    throw new Error("Data stok opname tidak lengkap!");
  }

  // Cek keunikan nomor dokumen
  const existing = await db.stokOpname.findUnique({
    where: { kodeOpname },
  });
  if (existing) {
    throw new Error(`Dokumen Opname "${kodeOpname}" sudah pernah dicatat!`);
  }

  const totalSelisihNilai = items.reduce((acc, item) => acc + item.nilaiSelisih, 0);

  const result = await db.$transaction(async (tx) => {
    // 1. Buat Header StokOpname & ItemStokOpname
    const opname = await tx.stokOpname.create({
      data: {
        kodeOpname,
        tanggal: tanggal || new Date(),
        keterangan: keterangan || null,
        totalSelisihNilai,
        items: {
          create: items.map((item) => ({
            barangId: item.barangId,
            stokSistem: Number(item.stokSistem),
            stokFisik: Number(item.stokFisik),
            selisih: Number(item.selisih),
            alasan: item.alasan,
            catatan: item.catatan || null,
            hargaBeli: Number(item.hargaBeli),
            nilaiSelisih: Number(item.nilaiSelisih),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Update stok fisik barang di master Barang sesuai hasil hitung fisik nyata
    for (const item of items) {
      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: Number(item.stokFisik),
        },
      });
    }

    return opname;
  });

  try {
    revalidatePath("/dashboard/stok-opname");
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return { success: true, data: result };
}

/**
 * Menghapus dokumen stok opname & mengembalikan stok ke kondisi sebelum opname (Rollback)
 */
export async function deleteStokOpname(id: string) {
  if (!id) throw new Error("ID stok opname tidak valid");

  await db.$transaction(async (tx) => {
    // 1. Ambil data opname
    const opname = await tx.stokOpname.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!opname) {
      throw new Error("Data stok opname tidak ditemukan!");
    }

    // 2. Rollback stok master barang
    for (const item of opname.items) {
      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            decrement: item.selisih, // jika selisih -3, decrement -3 = +3 (kembali ke semula)
          },
        },
      });
    }

    // 3. Hapus record opname (Cascade delete ItemStokOpname)
    await tx.stokOpname.delete({
      where: { id },
    });
  });

  try {
    revalidatePath("/dashboard/stok-opname");
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return { success: true };
}
