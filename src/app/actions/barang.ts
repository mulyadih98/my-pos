"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { generateId } from "@/lib/utils";
import { Prisma } from "@/generated/prisma/client";

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
  revalidateAfter?: boolean;
}

export interface ImportBarangResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function revalidateBarangPages() {
  safeRevalidate("/dashboard/barang");
  safeRevalidate("/dashboard/transaksi");
  safeRevalidate("/dashboard");
}

/**
 * Import data barang masal dari file Excel atau CSV (Dioptimasi untuk performa tinggi & bebas timeout)
 */
export async function importBarangBatch(
  items: ImportBarangItem[],
  options: ImportBarangOptions = { onDuplicate: "update", revalidateAfter: true }
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

  let defaultUnitId = unitMap.get("pcs");
  if (!defaultUnitId) {
    try {
      const pcs = await db.unit.create({ data: { name: "Pcs" } });
      defaultUnitId = pcs.id;
      unitMap.set("pcs", pcs.id);
    } catch {
      const pcs = await db.unit.findUnique({ where: { name: "Pcs" } });
      if (pcs) {
        defaultUnitId = pcs.id;
        unitMap.set("pcs", pcs.id);
      }
    }
  }

  const supplierMap = new Map<string, string>();
  for (const s of existingSuppliers) {
    supplierMap.set(s.nama.trim().toLowerCase(), s.id);
  }

  // 2. Pre-register Kategori, Unit, dan Supplier baru yang muncul pada batch ini
  const newKategoris = new Set<string>();
  const newUnits = new Set<string>();
  const newSuppliers = new Set<string>();

  for (const item of items) {
    if (item.kategori && item.kategori.trim()) {
      const k = item.kategori.trim();
      if (!kategoriMap.has(k.toLowerCase())) newKategoris.add(k);
    }
    if (item.satuan && item.satuan.trim()) {
      const u = item.satuan.trim();
      if (!unitMap.has(u.toLowerCase())) newUnits.add(u);
    }
    if (item.supplier && item.supplier.trim()) {
      const s = item.supplier.trim();
      if (!supplierMap.has(s.toLowerCase())) newSuppliers.add(s);
    }
  }

  for (const name of newKategoris) {
    try {
      const created = await db.kategori.create({ data: { nama: name } });
      kategoriMap.set(name.toLowerCase(), created.id);
    } catch {
      const found = await db.kategori.findUnique({ where: { nama: name } });
      if (found) kategoriMap.set(name.toLowerCase(), found.id);
    }
  }

  for (const name of newUnits) {
    try {
      const created = await db.unit.create({ data: { name } });
      unitMap.set(name.toLowerCase(), created.id);
    } catch {
      const found = await db.unit.findUnique({ where: { name } });
      if (found) unitMap.set(name.toLowerCase(), found.id);
    }
  }

  for (const name of newSuppliers) {
    try {
      const created = await db.supplier.create({ data: { nama: name } });
      supplierMap.set(name.toLowerCase(), created.id);
    } catch {
      const found = await db.supplier.findFirst({ where: { nama: name } });
      if (found) supplierMap.set(name.toLowerCase(), found.id);
    }
  }

  // 3. Validasi & Penyiapan Data dalam batch (dengan deduplikasi in-batch)
  type ProcessedItem = {
    kode: string;
    nama: string;
    stok: number;
    hargaBeli: number;
    hargaRetail: number;
    hargaMember: number;
    kategoriId: string | null;
    unitId: string;
    supplierId: string | null;
  };

  const processedItems: ProcessedItem[] = [];
  const seenCodesInBatch = new Map<string, number>();

  for (const item of items) {
    const nama = item.nama ? item.nama.trim() : "";
    if (!nama) {
      result.errors.push("Baris dilewati: Nama barang kosong.");
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

    let kode = item.kode ? String(item.kode).trim() : "";
    if (!kode) {
      kode = `899${Math.floor(10000000 + Math.random() * 90000000)}`;
    }

    const kategoriId = item.kategori?.trim()
      ? kategoriMap.get(item.kategori.trim().toLowerCase()) || null
      : null;
    const unitId = item.satuan?.trim()
      ? unitMap.get(item.satuan.trim().toLowerCase()) || defaultUnitId!
      : defaultUnitId!;
    const supplierId = item.supplier?.trim()
      ? supplierMap.get(item.supplier.trim().toLowerCase()) || null
      : null;

    const pItem: ProcessedItem = {
      kode,
      nama,
      stok,
      hargaBeli,
      hargaRetail,
      hargaMember,
      kategoriId,
      unitId,
      supplierId,
    };

    // Cek duplikasi barcode di dalam batch yang sama
    if (seenCodesInBatch.has(kode)) {
      if (options.onDuplicate === "skip") {
        result.skipped++;
        continue;
      } else {
        // Ganti dengan data terbaru dari baris terakhir
        const prevIdx = seenCodesInBatch.get(kode)!;
        processedItems[prevIdx] = pItem;
        continue;
      }
    }

    seenCodesInBatch.set(kode, processedItems.length);
    processedItems.push(pItem);
  }

  if (processedItems.length === 0) {
    return result;
  }

  // 4. Periksa data yang sudah ada di database dalam 1 query tunggal
  const batchCodes = processedItems.map((p) => p.kode);
  const existingInDb = await db.barang.findMany({
    where: { kode: { in: batchCodes } },
    include: { varians: true },
  });

  const existingMap = new Map<string, (typeof existingInDb)[0]>();
  for (const b of existingInDb) {
    existingMap.set(b.kode, b);
  }

  // 5. Pisahkan antara barang baru (Bulk Insert) dan barang lama (Update / Skip)
  const toCreateBarang: Prisma.BarangCreateManyInput[] = [];
  const toCreateVarian: Prisma.VarianBarangCreateManyInput[] = [];
  const toUpdateList: { item: ProcessedItem; existing: (typeof existingInDb)[0] }[] = [];

  for (const item of processedItems) {
    const existing = existingMap.get(item.kode);

    if (existing) {
      if (options.onDuplicate === "skip") {
        result.skipped++;
      } else {
        toUpdateList.push({ item, existing });
      }
    } else {
      const barangId = generateId();
      const varianId = generateId();

      toCreateBarang.push({
        id: barangId,
        kode: item.kode,
        nama: item.nama,
        stok: item.stok,
        hargaBeli: item.hargaBeli,
        kategoriId: item.kategoriId,
        supplierId: item.supplierId,
      });

      toCreateVarian.push({
        id: varianId,
        barangId,
        hargaRetail: item.hargaRetail,
        hargaMember: item.hargaMember,
        unitId: item.unitId,
        konversi: 1,
      });
    }
  }

  // 6. Eksekusi Bulk Insert barang baru (Hanya butuh 2 query SQL untuk semua barang baru)
  if (toCreateBarang.length > 0) {
    try {
      await db.barang.createMany({
        data: toCreateBarang,
        skipDuplicates: true,
      });
      await db.varianBarang.createMany({
        data: toCreateVarian,
        skipDuplicates: true,
      });
      result.created += toCreateBarang.length;
    } catch (err: any) {
      result.errors.push(`Gagal membuat barang baru secara massal: ${err.message}`);
    }
  }

  // 7. Eksekusi Update barang yang sudah ada
  for (const { item, existing } of toUpdateList) {
    try {
      await db.barang.update({
        where: { id: existing.id },
        data: {
          nama: item.nama,
          stok: item.stok,
          hargaBeli: item.hargaBeli,
          kategoriId: item.kategoriId || existing.kategoriId,
          supplierId: item.supplierId !== null ? item.supplierId : existing.supplierId,
        },
      });

      if (existing.varians && existing.varians.length > 0) {
        await db.varianBarang.update({
          where: { id: existing.varians[0].id },
          data: {
            hargaRetail: item.hargaRetail,
            hargaMember: item.hargaMember,
            unitId: item.unitId,
          },
        });
      } else {
        await db.varianBarang.create({
          data: {
            id: generateId(),
            barangId: existing.id,
            hargaRetail: item.hargaRetail,
            hargaMember: item.hargaMember,
            unitId: item.unitId,
            konversi: 1,
          },
        });
      }

      result.updated++;
    } catch (err: any) {
      result.errors.push(`Gagal memperbarui "${item.nama || item.kode}": ${err.message}`);
    }
  }

  if (options.revalidateAfter !== false) {
    safeRevalidate("/dashboard/barang");
    safeRevalidate("/dashboard/transaksi");
    safeRevalidate("/dashboard");
  }

  return result;
}
