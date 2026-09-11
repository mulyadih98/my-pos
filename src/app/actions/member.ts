"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getMemberByKode(kode: string) {
  return await db.member.findUnique({
    where: { kode }
  });
}

export async function createMember(data: {
  kode: string;
  nama: string;
  telepon?: string;
  alamat?: string;
}) {
  const member = await db.member.create({
    data
  });
  revalidatePath("/dashboard/member");
  return member;
}

export async function getMembers() {
  return await db.member.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteMember(id: string) {
  await db.member.delete({
    where: { id }
  });
  revalidatePath("/dashboard/member");
}

export async function updateMember(id: string, data: {
  kode: string;
  nama: string;
  telepon?: string;
  alamat?: string;
}) {
  await db.member.update({
    where: { id },
    data
  });
  revalidatePath("/dashboard/member");
}
