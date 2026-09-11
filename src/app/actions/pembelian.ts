"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface ItemPembelianInput {
  barangId: string;
  unitId?: string;
  qty: number;
  hargaBeli: number;
  subtotal: number;
  konversi: number;
}

export interface CreatePembelianInput {
  noFaktur: string;
  supplierId: string;
  tanggal?: Date;
  catatan?: string;
  items: ItemPembelianInput[];
}

/**
 * Mengambil semua riwayat faktur pembelian / stok masuk
 */
export async function getPembelianList() {
  return await db.pembelian.findMany({
    orderBy: {
      tanggal: "desc",
    },
    include: {
      supplier: true,
      items: {
        include: {
          barang: true,
          unit: true,
        },
      },
    },
  });
}

/**
 * Mencatat faktur pembelian baru dan otomatis menambah stok fisik barang di gudang
 */
export async function createPembelian(payload: CreatePembelianInput) {
  const { noFaktur, supplierId, tanggal, catatan, items } = payload;

  if (!noFaktur || !supplierId || !items || items.length === 0) {
    throw new Error("Data faktur pembelian tidak lengkap!");
  }

  // Cek apakah No. Faktur sudah pernah dipakai
  const existing = await db.pembelian.findUnique({
    where: { noFaktur },
  });
  if (existing) {
    throw new Error(`Nomor Faktur "${noFaktur}" sudah pernah dicatat!`);
  }

  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  const result = await db.$transaction(async (tx) => {
    // 1. Buat record Faktur Pembelian
    const pembelian = await tx.pembelian.create({
      data: {
        noFaktur,
        supplierId,
        tanggal: tanggal || new Date(),
        total,
        catatan: catatan || null,
        items: {
          create: items.map((item) => ({
            barangId: item.barangId,
            unitId: item.unitId || null,
            qty: Number(item.qty),
            hargaBeli: Number(item.hargaBeli),
            subtotal: Number(item.subtotal),
            konversi: Number(item.konversi || 1),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Tambah stok fisik barang di gudang & update harga beli modal
    for (const item of items) {
      const totalPcsAdded = Number(item.qty) * Number(item.konversi || 1);

      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            increment: totalPcsAdded,
          },
          hargaBeli: Number(item.hargaBeli), // Update harga modal beli terbaru
        },
      });
    }

    return pembelian;
  });

  try {
    revalidatePath("/dashboard/pembelian");
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return { success: true, data: result };
}

/**
 * Menghapus faktur pembelian dan otomatis mengurangi kembali stok fisik barang (Rollback)
 */
export async function deletePembelian(id: string) {
  if (!id) throw new Error("ID pembelian tidak valid");

  await db.$transaction(async (tx) => {
    // 1. Ambil data item pembelian yang akan dihapus
    const pembelian = await tx.pembelian.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!pembelian) {
      throw new Error("Data faktur pembelian tidak ditemukan!");
    }

    // 2. Rollback stok: kurangi stok yang sebelumnya sempat bertambah
    for (const item of pembelian.items) {
      const totalPcsReverted = item.qty * item.konversi;

      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            decrement: totalPcsReverted,
          },
        },
      });
    }

    // 3. Hapus record faktur (Cascade akan menghapus ItemPembelian)
    await tx.pembelian.delete({
      where: { id },
    });
  });

  try {
    revalidatePath("/dashboard/pembelian");
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return { success: true };
}
