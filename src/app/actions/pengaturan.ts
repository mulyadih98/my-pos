"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { StoreSettings, DEFAULT_STORE_SETTINGS } from "@/types/pengaturan";

export async function getPengaturanDefault(): Promise<StoreSettings> {
  try {
    let setting = await db.pengaturan.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await db.pengaturan.create({
        data: {
          id: "default",
          namaToko: DEFAULT_STORE_SETTINGS.namaToko,
          alamat: DEFAULT_STORE_SETTINGS.alamat,
          telepon: DEFAULT_STORE_SETTINGS.telepon,
          footerPesan: DEFAULT_STORE_SETTINGS.footerPesan,
          ukuranKertas: DEFAULT_STORE_SETTINGS.ukuranKertas,
          itemLineSpacing: DEFAULT_STORE_SETTINGS.itemLineSpacing || "normal",
        },
      });
    }

    return {
      namaToko: setting.namaToko,
      alamat: setting.alamat,
      telepon: setting.telepon,
      footerPesan: setting.footerPesan,
      ukuranKertas: (setting.ukuranKertas as "58mm" | "80mm") || "58mm",
      itemLineSpacing: (setting.itemLineSpacing as "compact" | "normal" | "loose") || "normal",
    };
  } catch (error) {
    console.error("Gagal mengambil pengaturan default:", error);
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function updatePengaturanDefault(data: StoreSettings): Promise<{ success: boolean; data?: StoreSettings; error?: string }> {
  try {
    const updated = await db.pengaturan.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        namaToko: data.namaToko || DEFAULT_STORE_SETTINGS.namaToko,
        alamat: data.alamat || DEFAULT_STORE_SETTINGS.alamat,
        telepon: data.telepon || DEFAULT_STORE_SETTINGS.telepon,
        footerPesan: data.footerPesan || DEFAULT_STORE_SETTINGS.footerPesan,
        ukuranKertas: data.ukuranKertas || "58mm",
        itemLineSpacing: data.itemLineSpacing || "normal",
      },
      update: {
        namaToko: data.namaToko,
        alamat: data.alamat,
        telepon: data.telepon,
        footerPesan: data.footerPesan,
        ukuranKertas: data.ukuranKertas,
        itemLineSpacing: data.itemLineSpacing || "normal",
      },
    });

    revalidatePath("/dashboard/pengaturan");
    revalidatePath("/dashboard/transaksi");
    return {
      success: true,
      data: {
        namaToko: updated.namaToko,
        alamat: updated.alamat,
        telepon: updated.telepon,
        footerPesan: updated.footerPesan,
        ukuranKertas: updated.ukuranKertas as "58mm" | "80mm",
        itemLineSpacing: (updated.itemLineSpacing as "compact" | "normal" | "loose") || "normal",
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Gagal menyimpan ke database" };
  }
}
