"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export async function createUnit(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await db.unit.create({ data: { name } });
  safeRevalidate("/dashboard/satuan");
}

export async function updateUnit(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id || !name) return;

  await db.unit.update({
    where: { id },
    data: { name },
  });

  safeRevalidate("/dashboard/satuan");
}

export async function deleteUnit(input: string | FormData) {
  const id = typeof input === "string" ? input : (input.get("id") as string);
  if (!id) throw new Error("ID satuan tidak valid");

  const unit = await db.unit.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          varians: true,
          itemPembelian: true,
        },
      },
    },
  });

  if (!unit) {
    throw new Error("Satuan tidak ditemukan.");
  }

  if (unit._count.varians > 0) {
    throw new Error(
      `Satuan "${unit.name}" tidak dapat dihapus karena masih digunakan oleh ${unit._count.varians} varian barang. Silakan ubah satuan pada barang terkait terlebih dahulu.`
    );
  }

  if (unit._count.itemPembelian > 0) {
    throw new Error(
      `Satuan "${unit.name}" tidak dapat dihapus karena tercatat dalam ${unit._count.itemPembelian} faktur pembelian supplier.`
    );
  }

  await db.unit.delete({
    where: { id },
  });

  safeRevalidate("/dashboard/satuan");
  safeRevalidate("/dashboard/barang");
  return { success: true };
}
