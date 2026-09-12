"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {}
}

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
  kategoriId?: string | null;
  hargaBeli: number;
  supplierId?: string | null;
  varians: VarianInput[];
}) {
  const { nama, kode, stok, kategoriId, hargaBeli, supplierId, varians } = payload;

  if (!nama || !kode || varians.length === 0) {
    throw new Error("Data tidak lengkap (Nama, Barcode, dan Varian Satuan wajib diisi)");
  }

  await db.$transaction(
    async (tx) => {
      const barang = await tx.barang.create({
        data: {
          nama,
          kode,
          stok,
          kategoriId: kategoriId || null,
          hargaBeli,
          supplierId: supplierId || null,
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
    },
    { maxWait: 10000, timeout: 20000 }
  );

  safeRevalidate("/dashboard/barang");
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

  safeRevalidate("/dashboard/barang");
  safeRevalidate("/dashboard/transaksi");
  safeRevalidate("/dashboard/promo");
  safeRevalidate("/dashboard");
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
    kategoriId?: string | null;
    hargaBeli: number;
    supplierId?: string | null;
  },
) {
  await db.barang.update({
    where: { id },
    data: {
      ...data,
      kategoriId: data.kategoriId || null,
      supplierId: data.supplierId || null,
    },
  });
  safeRevalidate("/dashboard/barang");
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
    kategoriId?: string | null;
    hargaBeli: number;
    supplierId?: string | null;
    varians: VarianInput[];
  },
) {
  await db.$transaction(
    async (tx) => {
      // 1. Update data induk barang
      await tx.barang.update({
        where: { id },
        data: {
          nama: data.nama,
          kode: data.kode,
          stok: data.stok,
          kategoriId: data.kategoriId || null,
          hargaBeli: data.hargaBeli,
          supplierId: data.supplierId || null,
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
  }, { maxWait: 10000, timeout: 20000 });

  safeRevalidate("/dashboard/barang");
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

export interface ImportBarangItem {
  kode?: string;
  nama: string;
  kategori?: string;
  satuan?: string;
  stok?: number;
  hargaBeli?: number;
  hargaRetail: number;
  hargaMember?: number;
  supplier?: string;
}

export interface ImportBarangOptions {
  onDuplicate?: "update" | "skip";
}

export interface ImportBarangResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * Import data barang masal dari file Excel atau CSV
 */
export async function importBarangBatch(
  items: ImportBarangItem[],
  options: ImportBarangOptions = { onDuplicate: "update" }
): Promise<ImportBarangResult> {
  const result: ImportBarangResult = {
    total: items.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  if (!items || items.length === 0) {
    return result;
  }

  // 1. Cache Master Kategori, Unit, dan Supplier yang ada
  const [existingCategories, existingUnits, existingSuppliers] = await Promise.all([
    db.kategori.findMany(),
    db.unit.findMany(),
    db.supplier.findMany(),
  ]);

  const kategoriMap = new Map<string, string>();
  for (const c of existingCategories) {
    kategoriMap.set(c.nama.trim().toLowerCase(), c.id);
  }

  const unitMap = new Map<string, string>();
  for (const u of existingUnits) {
    unitMap.set(u.name.trim().toLowerCase(), u.id);
  }

  // Pastikan ada satuan default "Pcs"
  let defaultUnitId = unitMap.get("pcs");
  if (!defaultUnitId) {
    const pcs = await db.unit.create({ data: { name: "Pcs" } });
    defaultUnitId = pcs.id;
    unitMap.set("pcs", pcs.id);
  }

  const supplierMap = new Map<string, string>();
  for (const s of existingSuppliers) {
    supplierMap.set(s.nama.trim().toLowerCase(), s.id);
  }

  // 2. Helper untuk mendapatkan atau membuat Kategori
  async function resolveKategoriId(name?: string): Promise<string | null> {
    if (!name || !name.trim()) return null;
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (kategoriMap.has(key)) {
      return kategoriMap.get(key)!;
    }
    const created = await db.kategori.create({ data: { nama: clean } });
    kategoriMap.set(key, created.id);
    return created.id;
  }

  // 3. Helper untuk mendapatkan atau membuat Satuan (Unit)
  async function resolveUnitId(name?: string): Promise<string> {
    if (!name || !name.trim()) return defaultUnitId!;
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (unitMap.has(key)) {
      return unitMap.get(key)!;
    }
    const created = await db.unit.create({ data: { name: clean } });
    unitMap.set(key, created.id);
    return created.id;
  }

  // 4. Helper untuk mendapatkan atau membuat Supplier (opsional)
  async function resolveSupplierId(name?: string): Promise<string | null> {
    if (!name || !name.trim()) return null;
    const clean = name.trim();
    const key = clean.toLowerCase();
    if (supplierMap.has(key)) {
      return supplierMap.get(key)!;
    }
    const created = await db.supplier.create({ data: { nama: clean } });
    supplierMap.set(key, created.id);
    return created.id;
  }

  // 5. Proses baris barang secara bertahap (chunking 20 item per batch)
  const chunkSize = 20;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    for (const item of chunk) {
      try {
        const nama = item.nama ? item.nama.trim() : "";
        if (!nama) {
          result.errors.push(`Baris lewati: Nama barang kosong.`);
          result.skipped++;
          continue;
        }

        const hargaRetail = Math.max(0, Math.round(Number(item.hargaRetail) || 0));
        if (hargaRetail <= 0) {
          result.errors.push(`Baris "${nama}": Harga retail harus lebih dari 0.`);
          result.skipped++;
          continue;
        }

        const hargaBeli = Math.max(0, Math.round(Number(item.hargaBeli) || 0));
        const hargaMember =
          item.hargaMember !== undefined && item.hargaMember !== null && Number(item.hargaMember) > 0
            ? Math.round(Number(item.hargaMember))
            : hargaRetail;
        const stok = Math.max(0, Math.round(Number(item.stok) || 0));

        // Generate barcode jika kosong
        let kode = item.kode ? String(item.kode).trim() : "";
        if (!kode) {
          const randomPart = Math.floor(10000000 + Math.random() * 90000000);
          kode = `899${randomPart}`;
        }

        const kategoriId = await resolveKategoriId(item.kategori);
        const unitId = await resolveUnitId(item.satuan);
        const supplierId = await resolveSupplierId(item.supplier);

        // Cek apakah barcode sudah ada di database
        const existing = await db.barang.findUnique({
          where: { kode },
          include: { varians: true },
        });

        if (existing) {
          if (options.onDuplicate === "skip") {
            result.skipped++;
            continue;
          }

          // Perbarui data barang dan varian utamanya
          await db.barang.update({
            where: { id: existing.id },
            data: {
              nama,
              stok: stok,
              hargaBeli,
              kategoriId: kategoriId || existing.kategoriId,
              supplierId: supplierId !== null ? supplierId : existing.supplierId,
            },
          });

          if (existing.varians && existing.varians.length > 0) {
            await db.varianBarang.update({
              where: { id: existing.varians[0].id },
              data: {
                hargaRetail,
                hargaMember,
                unitId,
              },
            });
          } else {
            await db.varianBarang.create({
              data: {
                barangId: existing.id,
                hargaRetail,
                hargaMember,
                unitId,
                konversi: 1,
              },
            });
          }

          result.updated++;
        } else {
          // Buat barang baru beserta varian dasarnya
          const createdBarang = await db.barang.create({
            data: {
              kode,
              nama,
              stok,
              hargaBeli,
              kategoriId,
              supplierId,
            },
          });

          await db.varianBarang.create({
            data: {
              barangId: createdBarang.id,
              hargaRetail,
              hargaMember,
              unitId,
              konversi: 1,
            },
          });

          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Gagal memproses "${item.nama || item.kode}": ${err.message}`);
      }
    }
  }

  safeRevalidate("/dashboard/barang");
  safeRevalidate("/dashboard/transaksi");
  safeRevalidate("/dashboard");

  return result;
}
