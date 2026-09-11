"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createSupplier(formData: FormData) {
  const nama = (formData.get("nama") as string)?.trim();
  const telepon = (formData.get("telepon") as string) || null;
  const alamat = (formData.get("alamat") as string) || null;

  if (!nama) return;

  await db.supplier.create({
    data: { nama, telepon, alamat },
  });

  revalidatePath("/dashboard/supplier");
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

  revalidatePath("/dashboard/supplier");
}

export async function deleteSupplier(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  await db.supplier.delete({ where: { id } });

  revalidatePath("/dashboard/supplier");
}
