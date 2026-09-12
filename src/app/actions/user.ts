"use server";

import { db } from "@/lib/db";
import { hashPassword, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  await requireRole(["OWNER"]);

  return await db.user.findMany({
    select: {
      id: true,
      username: true,
      nama: true,
      role: true,
      isActive: true,
      telepon: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          transaksi: true,
          biayaOperasional: true,
        },
      },
    },
    orderBy: [
      { role: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function createUser(payload: {
  username: string;
  nama: string;
  password: string;
  role: "OWNER" | "KASIR";
  telepon?: string;
}) {
  await requireRole(["OWNER"]);

  const { username, nama, password, role = "KASIR", telepon } = payload;

  if (!username || !nama || !password) {
    throw new Error("Username, Nama, dan Password wajib diisi.");
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    throw new Error("Username minimal 3 karakter.");
  }

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  const existing = await db.user.findUnique({
    where: { username: cleanUsername },
  });

  if (existing) {
    throw new Error(`Username "${cleanUsername}" sudah digunakan.`);
  }

  const user = await db.user.create({
    data: {
      username: cleanUsername,
      nama: nama.trim(),
      password: hashPassword(password),
      role,
      telepon: telepon ? telepon.trim() : null,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/user");
  return { success: true, id: user.id };
}

export async function updateUser(
  id: string,
  payload: {
    nama?: string;
    password?: string;
    role?: "OWNER" | "KASIR";
    isActive?: boolean;
    telepon?: string;
  }
) {
  const currentUser = await requireRole(["OWNER"]);

  const existing = await db.user.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  // Mencegah menonaktifkan atau menurunkan role akun sendiri jika sedang login
  if (currentUser.id === id) {
    if (payload.isActive === false) {
      throw new Error("Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.");
    }
    if (payload.role && payload.role !== "OWNER") {
      throw new Error("Anda tidak dapat mengubah peran akun Anda sendiri menjadi Kasir.");
    }
  }

  const data: any = {};
  if (payload.nama !== undefined) data.nama = payload.nama.trim();
  if (payload.role !== undefined) data.role = payload.role;
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);
  if (payload.telepon !== undefined) data.telepon = payload.telepon.trim() || null;
  if (payload.password && payload.password.trim().length > 0) {
    if (payload.password.trim().length < 6) {
      throw new Error("Password baru minimal 6 karakter.");
    }
    data.password = hashPassword(payload.password.trim());
  }

  const updated = await db.user.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/user");
  return { success: true, id: updated.id };
}

export async function deleteUser(id: string) {
  const currentUser = await requireRole(["OWNER"]);

  if (currentUser.id === id) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const target = await db.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          transaksi: true,
        },
      },
    },
  });

  if (!target) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  if (target.role === "OWNER") {
    const ownerCount = await db.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) {
      throw new Error("Tidak dapat menghapus Owner terakhir di sistem.");
    }
  }

  if (target._count.transaksi > 0) {
    // Jika memiliki riwayat transaksi, cukup nonaktifkan akun agar riwayat transaksi kasir tidak error
    await db.user.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath("/dashboard/user");
    return {
      success: true,
      message: `Akun "${target.nama}" telah dinonaktifkan karena memiliki riwayat ${target._count.transaksi} transaksi.`,
    };
  }

  await db.user.delete({
    where: { id },
  });

  revalidatePath("/dashboard/user");
  return { success: true, message: `Akun "${target.nama}" berhasil dihapus.` };
}
