"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

  revalidatePath("/dashboard/kategori");
  revalidatePath("/dashboard/barang");
}

export async function updateKategori(id: string, nama: string) {
  await db.kategori.update({
    where: { id },
    data: { nama }
  });

  revalidatePath("/dashboard/kategori");
}

export async function deleteKategori(id: string) {
  await db.kategori.delete({
    where: { id }
  });

  revalidatePath("/dashboard/kategori");
}
