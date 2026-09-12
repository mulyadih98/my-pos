"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

type VarianInput = {
  id?: string;
  hargaRetail: number;
  hargaMember: number;
  unitId: string;
  konversi: number;
};

/**
 * Membuat barang baru beserta varian-variannya dalam satu transaksi
 */
export async function createBarangWithVarian(payload: {
  nama: string;
  kode: string;
  stok: number;
  kategoriId?: string;
  hargaBeli: number;
  supplierId: string;
  varians: VarianInput[];
}) {
  const { nama, kode, stok, kategoriId, hargaBeli, supplierId, varians } = payload;

  if (!nama || !kode || !supplierId || varians.length === 0) {
    throw new Error("Data tidak lengkap");
  }

  await db.$transaction(async (tx) => {
    const barang = await tx.barang.create({
      data: {
        nama,
        kode,
        stok,
        kategoriId,
        hargaBeli,
        supplierId,
      },
    });

    await tx.varianBarang.createMany({
      data: varians.map((v) => ({
        barangId: barang.id,
        hargaRetail: v.hargaRetail,
        hargaMember: v.hargaMember,
        unitId: v.unitId,
        konversi: v.konversi,
      })),
    });
  });

  revalidatePath("/dashboard/barang");
}

/**
 * Menghapus barang dan variannya secara aman
 */
export async function deleteBarang(id: string) {
  // 1. Cek apakah barang memiliki riwayat transaksi penjualan
  const txCount = await db.itemTransaksi.count({
    where: { barangId: id },
  });
  if (txCount > 0) {
    throw new Error(
      "Barang tidak bisa dihapus karena sudah memiliki riwayat transaksi penjualan. Anda dapat mengubah stoknya menjadi 0 jika tidak lagi dijual."
    );
  }

  // 2. Cek apakah ada riwayat faktur pembelian dari supplier
  const pembelianCount = await db.itemPembelian.count({
    where: { barangId: id },
  });
  if (pembelianCount > 0) {
    throw new Error(
      "Barang tidak bisa dihapus karena memiliki riwayat faktur pembelian supplier."
    );
  }

  // 3. Cek apakah ada riwayat stok opname
  const opnameCount = await db.itemStokOpname.count({
    where: { barangId: id },
  });
  if (opnameCount > 0) {
    throw new Error(
      "Barang tidak bisa dihapus karena tercatat dalam dokumen riwayat stok opname."
    );
  }

  // 4. Bersihkan program promo yang mengaitkan barang ini sebagai syarat atau hadiah
  await db.promo.deleteMany({
    where: {
      OR: [{ barangSyaratId: id }, { barangHadiahId: id }],
    },
  });

  // 5. Hapus varian dan master barang
  await db.varianBarang.deleteMany({
    where: { barangId: id },
  });
  await db.barang.delete({
    where: { id },
  });

  revalidatePath("/dashboard/barang");
  revalidatePath("/dashboard/transaksi");
  revalidatePath("/dashboard/promo");
  revalidatePath("/dashboard");
}

/**
 * Update data barang saja
 */
export async function updateBarang(
  id: string,
  data: {
    nama: string;
    kode: string;
    stok: number;
    kategoriId: string;
    hargaBeli: number;
    supplierId: string;
  },
) {
  await db.barang.update({
    where: { id },
    data,
  });
  revalidatePath("/dashboard/barang");
}

/**
 * Update data barang dan varian (Metode Sync agar tidak melanggar Foreign Key)
 */
export async function updateBarangWithVarian(
  id: string,
  data: {
    nama: string;
    kode: string;
    stok: number;
    kategoriId: string;
    hargaBeli: number;
    supplierId: string;
    varians: VarianInput[];
  },
) {
  await db.$transaction(async (tx) => {
    // 1. Update data induk barang
    await tx.barang.update({
      where: { id },
      data: {
        nama: data.nama,
        kode: data.kode,
        stok: data.stok,
        kategoriId: data.kategoriId,
        hargaBeli: data.hargaBeli,
        supplierId: data.supplierId,
      },
    });

    // 2. Ambil semua varian yang ada di database saat ini
    const currentVarians = await tx.varianBarang.findMany({
      where: { barangId: id },
    });

    const newVarianIds = data.varians.map(v => v.id).filter(Boolean);

    // 3. Hapus varian yang tidak ada di list baru (Hanya jika belum ada transaksi)
    for (const current of currentVarians) {
      if (!newVarianIds.includes(current.id)) {
        // Cek apakah varian ini punya transaksi
        const hasTransaksi = await tx.itemTransaksi.findFirst({
          where: { varianId: current.id }
        });

        if (hasTransaksi) {
          throw new Error(`Varian ${current.id} tidak bisa dihapus karena sudah ada riwayat transaksi.`);
        }

        await tx.varianBarang.delete({
          where: { id: current.id }
        });
      }
    }

    // 4. Update atau Create varian
    for (const v of data.varians) {
      if (v.id) {
        // Update yang sudah ada
        await tx.varianBarang.update({
          where: { id: v.id },
          data: {
            hargaRetail: v.hargaRetail,
            hargaMember: v.hargaMember,
            unitId: v.unitId,
            konversi: v.konversi,
          }
        });
      } else {
        // Create baru
        await tx.varianBarang.create({
          data: {
            barangId: id,
            hargaRetail: v.hargaRetail,
            hargaMember: v.hargaMember,
            unitId: v.unitId,
            konversi: v.konversi,
          }
        });
      }
    }
  });

  revalidatePath("/dashboard/barang");
}

export async function getBarangForPOS() {
  return await db.barang.findMany({
    include: {
      varians: {
        include: {
          unit: true
        }
      },
      supplier: true,
      kategori: true
    },
    orderBy: {
      nama: 'asc'
    }
  });
}
