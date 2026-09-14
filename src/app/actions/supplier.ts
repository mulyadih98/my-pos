"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

export async function createSupplier(formData: FormData) {
  const nama = (formData.get("nama") as string)?.trim();
  const telepon = (formData.get("telepon") as string) || null;
  const alamat = (formData.get("alamat") as string) || null;

  if (!nama) return;

  await db.supplier.create({
    data: { nama, telepon, alamat },
  });

  safeRevalidate("/dashboard/supplier");
}

export async function updateSupplier(formData: FormData) {
  const id = formData.get("id") as string;
  const nama = (formData.get("nama") as string)?.trim();
  const telepon = (formData.get("telepon") as string) || null;
  const alamat = (formData.get("alamat") as string) || null;

  if (!id || !nama) return;

  await db.supplier.update({
    where: { id },
    data: { nama, telepon, alamat },
  });

  safeRevalidate("/dashboard/supplier");
}

export async function deleteSupplier(input: string | FormData) {
  const id = typeof input === "string" ? input : (input.get("id") as string);
  if (!id) throw new Error("ID supplier tidak valid");

  const supplier = await db.supplier.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          barang: true,
          pembelian: true,
        },
      },
    },
  });

  if (!supplier) {
    throw new Error("Supplier tidak ditemukan.");
  }

  if (supplier._count.pembelian > 0) {
    throw new Error(
      `Supplier "${supplier.nama}" tidak dapat dihapus karena tercatat dalam ${supplier._count.pembelian} faktur pembelian. Hapus atau arsipkan faktur pembelian terlebih dahulu.`
    );
  }

  // Lepaskan supplier dari barang terkait (menjadi tanpa supplier)
  await db.barang.updateMany({
    where: { supplierId: id },
    data: { supplierId: null },
  });

  await db.supplier.delete({ where: { id } });

  safeRevalidate("/dashboard/supplier");
  safeRevalidate("/dashboard/barang");
  return { success: true };
}
