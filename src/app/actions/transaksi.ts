"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type TransactionItemInput = {
  barangId: string;
  varianId: string;
  qty: number;
  hargaJual: number;
  subtotal: number;
  konversi: number; // needed for stock calculation
  isBonus?: boolean;
  promoId?: string;
};

export async function createTransaksi(payload: {
  total: number;
  bayar: number;
  kembali: number;
  items: TransactionItemInput[];
  memberId?: string;
}) {
  const { total, bayar, kembali, items, memberId } = payload;

  if (items.length === 0) {
    throw new Error("Keranjang belanja kosong");
  }

  // Generate Invoice: INV-YYYYMMDD-Random
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const invoice = `INV-${dateStr}-${randomStr}`;

  await db.$transaction(async (tx) => {
    // 1. Create Transaction
    const transaksi = await tx.transaksi.create({
      data: {
        invoice,
        total,
        bayar,
        kembali,
        memberId,
      },
    });

    // 2. Create Transaction Items & Update Stock
    for (const item of items) {
      // Get current stock first to validate
      const currentBarang = await tx.barang.findUnique({
        where: { id: item.barangId },
        select: { stok: true, nama: true }
      });

      const stokDihapus = item.qty * item.konversi;

      if (!currentBarang || currentBarang.stok < stokDihapus) {
        throw new Error(`Stok tidak mencukupi untuk barang: ${currentBarang?.nama || 'Tidak diketahui'}. Tersedia: ${currentBarang?.stok || 0}`);
      }

      await tx.itemTransaksi.create({
        data: {
          transaksiId: transaksi.id,
          barangId: item.barangId,
          varianId: item.varianId,
          qty: item.qty,
          hargaJual: item.hargaJual,
          subtotal: item.subtotal,
          isBonus: Boolean(item.isBonus),
          promoId: item.promoId || null,
        },
      });

      // Update Stock: total_stock -= (qty * konversi)
      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            decrement: stokDihapus
          }
        }
      });
    }
  });

  try {
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard/transaksi");
    revalidatePath("/dashboard/riwayat");
  } catch {}
  
  return { success: true, invoice };
}

export async function getTransaksi() {
  return await db.transaksi.findMany({
    include: {
      member: true,
      items: {
        include: {
          barang: true,
          promo: true,
          varian: {
            include: {
              unit: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
