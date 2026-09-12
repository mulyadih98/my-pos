"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type TransactionItemInput = {
  barangId: string;
  varianId: string;
  qty: number;
  hargaJual: number;
  subtotal: number;
  konversi: number; // needed for stock calculation
  isBonus?: boolean;
  promoId?: string;
};

export interface TransaksiFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  status?: string;    // "SELESAI" | "BATAL" | "SEMUA"
  metodePembayaran?: string; // "TUNAI" | "QRIS" | "TRANSFER" | "DEBIT" | "HUTANG" | "SEMUA"
}

export async function createTransaksi(payload: {
  subtotal?: number;
  diskonPersen?: number;
  diskonNominal?: number;
  total: number;
  metodePembayaran?: string;
  referensiPembayaran?: string;
  bayar: number;
  kembali: number;
  catatan?: string;
  items: TransactionItemInput[];
  memberId?: string;

  // Integrasi Kasbon / Hutang
  kasbonNamaPelanggan?: string;
  kasbonTelepon?: string;
  kasbonJatuhTempo?: string | null;
  potongKembalianKasbonId?: string;
  potongKembalianJumlah?: number;
}) {
  const {
    subtotal: initialSubtotal,
    diskonPersen = 0,
    diskonNominal = 0,
    total,
    metodePembayaran = "TUNAI",
    referensiPembayaran,
    bayar,
    kembali,
    catatan,
    items,
    memberId,
    kasbonNamaPelanggan,
    kasbonTelepon,
    kasbonJatuhTempo,
    potongKembalianKasbonId,
    potongKembalianJumlah = 0,
  } = payload;

  if (items.length === 0) {
    throw new Error("Keranjang belanja kosong");
  }

  // Hitung subtotal jika tidak disertakan
  const calculatedSubtotal = initialSubtotal ?? items.reduce((acc, it) => acc + it.subtotal, 0);

  // Generate Invoice: INV-YYYYMMDD-Random
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const invoice = `INV-${dateStr}-${randomStr}`;

  let finalKasbonInfo: any = null;

  await db.$transaction(async (tx) => {
    let linkedKasbonId: string | null = null;
    let nominalTambahHutang = 0;

    // 1. Tangani jika metode pembayaran adalah HUTANG (Kasbon)
    if (metodePembayaran === "HUTANG") {
      nominalTambahHutang = Math.max(0, total - bayar);

      let namaCustomer = kasbonNamaPelanggan?.trim();
      let telpCustomer = kasbonTelepon?.trim() || null;

      if (memberId) {
        const mbr = await tx.member.findUnique({ where: { id: memberId } });
        if (mbr) {
          namaCustomer = mbr.nama;
          telpCustomer = mbr.telepon || telpCustomer;
        }
      }

      if (!namaCustomer || namaCustomer.length === 0) {
        throw new Error("Nama pelanggan wajib diisi untuk transaksi kasbon/hutang.");
      }

      // Cari atau buat akun BukuKasbon pelanggan
      let kasbon = await tx.bukuKasbon.findFirst({
        where: memberId
          ? { memberId }
          : { namaPelanggan: namaCustomer },
      });

      const parsedJatuhTempo = kasbonJatuhTempo ? new Date(kasbonJatuhTempo) : null;

      if (!kasbon) {
        kasbon = await tx.bukuKasbon.create({
          data: {
            namaPelanggan: namaCustomer,
            telepon: telpCustomer,
            memberId: memberId || null,
            totalHutang: nominalTambahHutang,
            totalBayar: 0,
            saldoHutang: nominalTambahHutang,
            jatuhTempo: parsedJatuhTempo,
          },
        });
      } else {
        kasbon = await tx.bukuKasbon.update({
          where: { id: kasbon.id },
          data: {
            totalHutang: { increment: nominalTambahHutang },
            saldoHutang: { increment: nominalTambahHutang },
            telepon: telpCustomer || kasbon.telepon,
            jatuhTempo: parsedJatuhTempo ?? kasbon.jatuhTempo,
          },
        });
      }

      linkedKasbonId = kasbon.id;
      finalKasbonInfo = {
        kasbonId: kasbon.id,
        namaPelanggan: kasbon.namaPelanggan,
        tambahHutang: nominalTambahHutang,
        saldoAkhir: kasbon.saldoHutang,
        jatuhTempo: kasbon.jatuhTempo,
      };
    }

    // 2. Buat Transaksi
    const transaksi = await tx.transaksi.create({
      data: {
        invoice,
        subtotal: calculatedSubtotal,
        diskonPersen: Math.max(0, Number(diskonPersen) || 0),
        diskonNominal: Math.max(0, Number(diskonNominal) || 0),
        total,
        metodePembayaran,
        referensiPembayaran: referensiPembayaran ? referensiPembayaran.trim() : null,
        bayar,
        kembali,
        catatan: catatan ? catatan.trim() : null,
        status: "SELESAI",
        memberId: memberId || null,
        kasbonId: linkedKasbonId,
        tambahHutang: nominalTambahHutang,
        potongKembalian: potongKembalianJumlah > 0 ? potongKembalianJumlah : 0,
      },
    });

    // 3. Tangani Pemotongan Kembalian untuk Membayar Kasbon (jika ada)
    if (potongKembalianKasbonId && potongKembalianJumlah > 0) {
      const targetKasbon = await tx.bukuKasbon.findUnique({
        where: { id: potongKembalianKasbonId },
      });

      if (targetKasbon && targetKasbon.saldoHutang > 0) {
        const nominalPotong = Math.min(potongKembalianJumlah, targetKasbon.saldoHutang);
        const saldoSebelum = targetKasbon.saldoHutang;
        const saldoSesudah = saldoSebelum - nominalPotong;

        await tx.bukuKasbon.update({
          where: { id: potongKembalianKasbonId },
          data: {
            saldoHutang: saldoSesudah,
            totalBayar: { increment: nominalPotong },
          },
        });

        const noPembayaran = `KSB-${dateStr}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await tx.riwayatPembayaranKasbon.create({
          data: {
            noPembayaran,
            kasbonId: potongKembalianKasbonId,
            jumlahBayar: nominalPotong,
            saldoSebelum,
            saldoSesudah,
            metode: "KEMBALIAN",
            transaksiBelanjaId: transaksi.id,
            catatan: `Dipotong dari kembalian belanja ${invoice}`,
          },
        });

        finalKasbonInfo = {
          ...(finalKasbonInfo || {}),
          potongKembalianKasbonId,
          namaPelanggan: targetKasbon.namaPelanggan,
          potongKembalian: nominalPotong,
          saldoAkhir: saldoSesudah,
        };
      }
    }

    // 4. Create Transaction Items & Update Stock
    for (const item of items) {
      const currentBarang = await tx.barang.findUnique({
        where: { id: item.barangId },
        select: { stok: true, nama: true },
      });

      const stokDihapus = item.qty * item.konversi;

      if (!currentBarang || currentBarang.stok < stokDihapus) {
        throw new Error(
          `Stok tidak mencukupi untuk barang: ${currentBarang?.nama || "Tidak diketahui"}. Tersedia: ${currentBarang?.stok || 0}`
        );
      }

      await tx.itemTransaksi.create({
        data: {
          transaksiId: transaksi.id,
          barangId: item.barangId,
          varianId: item.varianId,
          qty: item.qty,
          hargaJual: item.hargaJual,
          subtotal: item.subtotal,
          isBonus: Boolean(item.isBonus),
          promoId: item.promoId || null,
        },
      });

      // Update Stock: total_stock -= (qty * konversi)
      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            decrement: stokDihapus,
          },
        },
      });
    }
  });

  try {
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard/transaksi");
    revalidatePath("/dashboard/riwayat");
    revalidatePath("/dashboard/laba-rugi");
    revalidatePath("/dashboard/kasbon");
    revalidatePath("/dashboard");
  } catch {}

  return { success: true, invoice, kasbonInfo: finalKasbonInfo };
}

/**
 * Membatalkan (Void) Transaksi dan mengembalikan stok barang ke semula
 */
export async function voidTransaksi(id: string, alasan: string) {
  if (!id) {
    throw new Error("ID transaksi tidak valid");
  }

  if (!alasan || alasan.trim().length === 0) {
    throw new Error("Alasan pembatalan harus diisi");
  }

  const existingTx = await db.transaksi.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          varian: true,
          barang: true,
        },
      },
    },
  });

  if (!existingTx) {
    throw new Error("Transaksi tidak ditemukan");
  }

  if (existingTx.status === "BATAL") {
    throw new Error("Transaksi ini sudah pernah dibatalkan sebelumnya");
  }

  await db.$transaction(async (tx) => {
    // 1. Ubah status transaksi menjadi BATAL
    await tx.transaksi.update({
      where: { id },
      data: {
        status: "BATAL",
        alasanBatal: alasan.trim(),
        batalAt: new Date(),
      },
    });

    // 2. Kembalikan saldo kasbon jika transaksi ini menambah hutang
    if (existingTx.kasbonId && existingTx.tambahHutang > 0) {
      await tx.bukuKasbon.update({
        where: { id: existingTx.kasbonId },
        data: {
          totalHutang: { decrement: existingTx.tambahHutang },
          saldoHutang: { decrement: existingTx.tambahHutang },
        },
      });
    }

    // 3. Kembalikan saldo kasbon jika transaksi ini memotong kembalian untuk bayar kasbon
    if (existingTx.potongKembalian > 0) {
      const riwayat = await tx.riwayatPembayaranKasbon.findFirst({
        where: { transaksiBelanjaId: id },
      });
      if (riwayat) {
        await tx.bukuKasbon.update({
          where: { id: riwayat.kasbonId },
          data: {
            saldoHutang: { increment: riwayat.jumlahBayar },
            totalBayar: { decrement: riwayat.jumlahBayar },
          },
        });
        await tx.riwayatPembayaranKasbon.delete({
          where: { id: riwayat.id },
        });
      }
    }

    // 4. Kembalikan stok setiap barang yang ada di transaksi
    for (const item of existingTx.items) {
      const konversi = item.varian?.konversi || 1;
      const stokKembali = item.qty * konversi;

      await tx.barang.update({
        where: { id: item.barangId },
        data: {
          stok: {
            increment: stokKembali,
          },
        },
      });
    }
  });

  try {
    revalidatePath("/dashboard/riwayat");
    revalidatePath("/dashboard/barang");
    revalidatePath("/dashboard/transaksi");
    revalidatePath("/dashboard/laba-rugi");
    revalidatePath("/dashboard/kasbon");
    revalidatePath("/dashboard");
  } catch {}

  return { success: true, invoice: existingTx.invoice };
}

export async function getTransaksi(filter?: TransaksiFilter) {
  const whereClause: any = {};

  // Filter Tanggal
  if (filter?.startDate || filter?.endDate) {
    whereClause.createdAt = {};
    if (filter.startDate) {
      whereClause.createdAt.gte = new Date(`${filter.startDate}T00:00:00`);
    }
    if (filter.endDate) {
      whereClause.createdAt.lte = new Date(`${filter.endDate}T23:59:59.999`);
    }
  }

  // Filter Status
  if (filter?.status && filter.status !== "SEMUA") {
    whereClause.status = filter.status;
  }

  // Filter Metode Pembayaran
  if (filter?.metodePembayaran && filter.metodePembayaran !== "SEMUA") {
    whereClause.metodePembayaran = filter.metodePembayaran;
  }

  return await db.transaksi.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    include: {
      member: true,
      kasbon: true,
      items: {
        include: {
          barang: true,
          promo: true,
          varian: {
            include: {
              unit: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
