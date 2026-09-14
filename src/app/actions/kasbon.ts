"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

export interface KasbonFilter {
  search?: string;
  status?: "SEMUA" | "BELUM_LUNAS" | "LUNAS";
}

/**
 * Mengambil daftar seluruh buku kasbon toko beserta rekapitulasi KPI
 */
export async function getDaftarKasbon(filter?: KasbonFilter) {
  const whereClause: any = {};

  if (filter?.status === "BELUM_LUNAS") {
    whereClause.saldoHutang = { gt: 0 };
  } else if (filter?.status === "LUNAS") {
    whereClause.saldoHutang = 0;
  }

  if (filter?.search && filter.search.trim().length > 0) {
    const q = filter.search.trim();
    whereClause.OR = [
      { namaPelanggan: { contains: q } },
      { telepon: { contains: q } },
      { member: { nama: { contains: q } } },
      { member: { kode: { contains: q } } },
    ];
  }

  const list = await db.bukuKasbon.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      member: true,
      _count: {
        select: {
          transaksiBelanja: true,
          riwayatPembayaran: true,
        },
      },
    },
    orderBy: [
      { saldoHutang: "desc" },
      { updatedAt: "desc" },
    ],
  });

  // Hitung KPI ringkasan
  const allKasbon = await db.bukuKasbon.findMany({
    select: {
      saldoHutang: true,
      totalBayar: true,
      totalHutang: true,
      jatuhTempo: true,
    },
  });

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  let totalPiutangAktif = 0;
  let jumlahPeminjamAktif = 0;
  let jumlahLewatJatuhTempo = 0;
  let totalSudahDilunasi = 0;

  for (const item of allKasbon) {
    if (item.saldoHutang > 0) {
      totalPiutangAktif += item.saldoHutang;
      jumlahPeminjamAktif += 1;

      if (item.jatuhTempo) {
        const jtStr = new Date(item.jatuhTempo).toISOString().slice(0, 10);
        if (jtStr < todayStr) {
          jumlahLewatJatuhTempo += 1;
        }
      }
    }
    totalSudahDilunasi += item.totalBayar;
  }

  return {
    list,
    summary: {
      totalPiutangAktif,
      jumlahPeminjamAktif,
      jumlahLewatJatuhTempo,
      totalSudahDilunasi,
      totalPeminjamTerdaftar: allKasbon.length,
    },
  };
}

/**
 * Mengambil kartu kasbon buku besar lengkap per pelanggan (Ledger Rinci)
 */
export async function getKartuKasbon(kasbonId: string) {
  if (!kasbonId) throw new Error("ID Kasbon tidak valid");

  const kasbon = await db.bukuKasbon.findUnique({
    where: { id: kasbonId },
    include: {
      member: true,
      transaksiBelanja: {
        where: {
          status: { not: "BATAL" },
        },
        include: {
          items: {
            include: {
              barang: true,
              varian: {
                include: { unit: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      riwayatPembayaran: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          transaksiBelanja: {
            select: {
              invoice: true,
              total: true,
            },
          },
        },
      },
    },
  });

  if (!kasbon) throw new Error("Buku kasbon tidak ditemukan");

  return kasbon;
}

/**
 * Pencarian cepat akun kasbon untuk autocomplete kasir POS
 * Mendukung pencarian case-insensitive dan opsi pelanggan lunas/aktif
 */
export async function searchKasbonForPOS(
  query?: string,
  options?: { onlyWithDebt?: boolean }
) {
  const onlyWithDebt = options?.onlyWithDebt ?? true;
  const whereClause: any = {};

  if (onlyWithDebt) {
    whereClause.saldoHutang = { gt: 0 };
  }

  if (query && query.trim().length > 0) {
    const q = query.trim();
    whereClause.OR = [
      { namaPelanggan: { contains: q, mode: "insensitive" } },
      { telepon: { contains: q, mode: "insensitive" } },
      { member: { nama: { contains: q, mode: "insensitive" } } },
      { member: { kode: { contains: q, mode: "insensitive" } } },
    ];
  }

  return await db.bukuKasbon.findMany({
    where: whereClause,
    include: {
      member: true,
    },
    orderBy: [
      { saldoHutang: "desc" },
      { updatedAt: "desc" },
    ],
    take: 10,
  });
}

/**
 * Membayar cicilan atau pelunasan kasbon langsung di kasir POS
 * Mendukung metode TUNAI, QRIS, TRANSFER, dan DEBIT
 */
export async function bayarKasbonLangsung(payload: {
  kasbonId: string;
  jumlahBayar: number;
  metode: string; // TUNAI, QRIS, TRANSFER, DEBIT
  referensi?: string;
  catatan?: string;
}) {
  const { kasbonId, jumlahBayar, metode = "TUNAI", referensi, catatan } = payload;

  if (!kasbonId) {
    throw new Error("Pilih pelanggan kasbon yang akan dibayar.");
  }

  const nominal = Number(jumlahBayar);
  if (!nominal || nominal <= 0) {
    throw new Error("Nominal pembayaran harus lebih dari 0.");
  }

  // Generate No. Pembayaran: KSB-YYYYMMDD-XXXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const noPembayaran = `KSB-${dateStr}-${randomStr}`;
  const currentUser = await getCurrentUser();

  const result = await db.$transaction(async (tx) => {
    const kasbon = await tx.bukuKasbon.findUnique({
      where: { id: kasbonId },
      include: { member: true },
    });

    if (!kasbon) {
      throw new Error("Akun kasbon pelanggan tidak ditemukan.");
    }

    if (kasbon.saldoHutang <= 0) {
      throw new Error(`Pelanggan "${kasbon.namaPelanggan}" sudah tidak memiliki saldo hutang.`);
    }

    // Nominal bayar tidak boleh melebihi saldo hutang aktif
    const bayarBersih = Math.min(nominal, kasbon.saldoHutang);
    const saldoSebelum = kasbon.saldoHutang;
    const saldoSesudah = saldoSebelum - bayarBersih;

    // 1. Update BukuKasbon
    const updatedKasbon = await tx.bukuKasbon.update({
      where: { id: kasbonId },
      data: {
        saldoHutang: saldoSesudah,
        totalBayar: {
          increment: bayarBersih,
        },
      },
    });

    // 2. Catat riwayat pembayaran
    const riwayat = await tx.riwayatPembayaranKasbon.create({
      data: {
        noPembayaran,
        kasbonId,
        jumlahBayar: bayarBersih,
        saldoSebelum,
        saldoSesudah,
        metode,
        referensi: referensi ? referensi.trim() : null,
        catatan: catatan ? catatan.trim() : null,
      },
    });

    return {
      kasbon: updatedKasbon,
      riwayat,
      namaPelanggan: kasbon.namaPelanggan,
      telepon: kasbon.telepon,
      bayarBersih,
      saldoSebelum,
      saldoSesudah,
      noPembayaran,
      kasirNama: currentUser?.nama || currentUser?.username || "Kasir",
    };
  });

  try {
    revalidatePath("/dashboard/kasbon");
    revalidatePath("/dashboard/transaksi");
    revalidatePath("/dashboard/riwayat");
  } catch {}

  return {
    success: true,
    data: result,
  };
}

/**
 * Menghapus akun kasbon (hanya jika saldo hutang sudah 0)
 */
export async function deleteKasbon(kasbonId: string) {
  const kasbon = await db.bukuKasbon.findUnique({
    where: { id: kasbonId },
  });

  if (!kasbon) throw new Error("Buku kasbon tidak ditemukan.");
  if (kasbon.saldoHutang > 0) {
    throw new Error(
      `Tidak dapat menghapus akun kasbon ini karena masih memiliki saldo hutang aktif sebesar Rp ${kasbon.saldoHutang.toLocaleString("id-ID")}.`
    );
  }

  await db.bukuKasbon.delete({
    where: { id: kasbonId },
  });

  revalidatePath("/dashboard/kasbon");
  return { success: true };
}
