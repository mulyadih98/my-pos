"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export async function getKategori() {
  return await db.kategori.findMany({
    orderBy: { nama: 'asc' }
  });
}

export async function createKategori(nama: string) {
  if (!nama) throw new Error("Nama kategori wajib diisi");
  
  await db.kategori.create({
    data: { nama }
  });

  safeRevalidate("/dashboard/kategori");
  safeRevalidate("/dashboard/barang");
}

export async function updateKategori(id: string, nama: string) {
  await db.kategori.update({
    where: { id },
    data: { nama }
  });

  safeRevalidate("/dashboard/kategori");
}

export async function deleteKategori(id: string) {
  if (!id) throw new Error("ID kategori tidak valid");

  const kategori = await db.kategori.findUnique({
    where: { id },
  });

  if (!kategori) {
    throw new Error("Kategori tidak ditemukan.");
  }

  // Lepaskan relasi kategori dari barang terlebih dahulu agar barang menjadi tanpa kategori
  await db.barang.updateMany({
    where: { kategoriId: id },
    data: { kategoriId: null },
  });

  await db.kategori.delete({
    where: { id },
  });

  safeRevalidate("/dashboard/kategori");
  safeRevalidate("/dashboard/barang");
  return { success: true };
}
