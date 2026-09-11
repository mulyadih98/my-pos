"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type PromoInput = {
  nama: string;
  tipe?: string;
  barangSyaratId: string;
  minBeliQty: number;
  barangHadiahId: string;
  hadiahQty: number;
  tanggalMulai: string | Date;
  tanggalSelesai: string | Date;
  isActive?: boolean;
};

export async function getPromos() {
  return await db.promo.findMany({
    include: {
      barangSyarat: {
        include: {
          varians: {
            include: { unit: true },
          },
        },
      },
      barangHadiah: {
        include: {
          varians: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActivePromos() {
  const now = new Date();
  return await db.promo.findMany({
    where: {
      isActive: true,
      tanggalMulai: { lte: now },
      tanggalSelesai: { gte: now },
    },
    include: {
      barangSyarat: {
        include: {
          varians: {
            include: { unit: true },
          },
        },
      },
      barangHadiah: {
        include: {
          varians: {
            include: { unit: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createPromo(payload: PromoInput) {
  const {
    nama,
    tipe = "BUY_X_GET_Y",
    barangSyaratId,
    minBeliQty,
    barangHadiahId,
    hadiahQty,
    tanggalMulai,
    tanggalSelesai,
    isActive = true,
  } = payload;

  if (!nama || !barangSyaratId || !barangHadiahId || !tanggalMulai || !tanggalSelesai) {
    throw new Error("Lengkapi semua data promo yang wajib diisi.");
  }

  if (minBeliQty < 1 || hadiahQty < 1) {
    throw new Error("Jumlah minimal beli dan hadiah minimal 1.");
  }

  const promo = await db.promo.create({
    data: {
      nama,
      tipe,
      barangSyaratId,
      minBeliQty: Number(minBeliQty),
      barangHadiahId,
      hadiahQty: Number(hadiahQty),
      tanggalMulai: new Date(tanggalMulai),
      tanggalSelesai: new Date(tanggalSelesai),
      isActive: Boolean(isActive),
    },
  });

  try {
    revalidatePath("/dashboard/promo");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return promo;
}

export async function updatePromo(id: string, payload: Partial<PromoInput>) {
  if (!id) throw new Error("ID promo tidak valid");

  const data: any = {};
  if (payload.nama !== undefined) data.nama = payload.nama;
  if (payload.tipe !== undefined) data.tipe = payload.tipe;
  if (payload.barangSyaratId !== undefined) data.barangSyaratId = payload.barangSyaratId;
  if (payload.minBeliQty !== undefined) data.minBeliQty = Number(payload.minBeliQty);
  if (payload.barangHadiahId !== undefined) data.barangHadiahId = payload.barangHadiahId;
  if (payload.hadiahQty !== undefined) data.hadiahQty = Number(payload.hadiahQty);
  if (payload.tanggalMulai !== undefined) data.tanggalMulai = new Date(payload.tanggalMulai);
  if (payload.tanggalSelesai !== undefined) data.tanggalSelesai = new Date(payload.tanggalSelesai);
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);

  const updated = await db.promo.update({
    where: { id },
    data,
  });

  try {
    revalidatePath("/dashboard/promo");
    revalidatePath("/dashboard/transaksi");
  } catch {}

  return updated;
}

export async function togglePromoStatus(id: string, isActive: boolean) {
  await db.promo.update({
    where: { id },
    data: { isActive },
  });

  try {
    revalidatePath("/dashboard/promo");
    revalidatePath("/dashboard/transaksi");
  } catch {}
}

export async function deletePromo(id: string) {
  await db.promo.delete({
    where: { id },
  });

  try {
    revalidatePath("/dashboard/promo");
    revalidatePath("/dashboard/transaksi");
  } catch {}
}
