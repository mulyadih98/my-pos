"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createUnit(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;

  await db.unit.create({ data: { name } });
  revalidatePath("/dashboard/satuan");
}

export async function updateUnit(formData: FormData) {
  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();

  if (!id || !name) return;

  await db.unit.update({
    where: { id },
    data: { name },
  });

  revalidatePath("/dashboard/satuan");
}

export async function deleteUnit(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  await db.unit.delete({
    where: { id },
  });

  revalidatePath("/dashboard/satuan");
}
