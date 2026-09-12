import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";

async function main() {
  console.log("🌱 Mulai proses seeding database...");

  // 0. Default Users (Owner & Kasir)
  const defaultUsers = [
    {
      username: "owner",
      nama: "Pemilik Toko (Owner)",
      password: hashPassword("owner123"),
      role: "OWNER",
      telepon: "0812-0000-0001",
    },
    {
      username: "kasir",
      nama: "Kasir Toko (Shift 1)",
      password: hashPassword("kasir123"),
      role: "KASIR",
      telepon: "0812-0000-0002",
    },
  ];

  for (const u of defaultUsers) {
    await db.user.upsert({
      where: { username: u.username },
      update: {
        role: u.role,
        nama: u.nama,
      },
      create: u,
    });
  }
  console.log(`✅ ${defaultUsers.length} Akun pengguna default (Owner & Kasir) disiapkan.`);

  // 1. Satuan / Units
  const unitsData = [
    { name: "Pcs" },
    { name: "Dus" },
    { name: "Pak" },
    { name: "Botol" },
    { name: "Sachet" },
  ];

  const units: Record<string, any> = {};
  for (const u of unitsData) {
    units[u.name] = await db.unit.upsert({
      where: { name: u.name },
      update: {},
      create: u,
    });
  }
  console.log(`✅ ${Object.keys(units).length} Satuan berhasil disiapkan.`);

  // 2. Kategori
  const categoriesData = [
    { nama: "Makanan & Minuman" },
    { nama: "Sembako" },
    { nama: "Kebutuhan Rumah Tangga" },
    { nama: "Alat Tulis & Kantor" },
    { nama: "Personal Care" },
  ];

  const categories: Record<string, any> = {};
  for (const c of categoriesData) {
    categories[c.nama] = await db.kategori.upsert({
      where: { nama: c.nama },
      update: {},
      create: c,
    });
  }
  console.log(`✅ ${Object.keys(categories).length} Kategori berhasil disiapkan.`);

  // 3. Supplier
  const suppliersData = [
    {
      nama: "PT Sumber Berkah Retail",
      telepon: "0812-3456-7890",
      alamat: "Jl. Pergudangan Surya No. 12, Jakarta",
    },
    {
      nama: "CV Maju Jaya Abadi",
      telepon: "0821-9876-5432",
      alamat: "Komplek Distribusi Prima Blok B4, Tangerang",
    },
  ];

  const suppliers: any[] = [];
  for (const s of suppliersData) {
    let existing = await db.supplier.findFirst({ where: { nama: s.nama } });
    if (!existing) {
      existing = await db.supplier.create({ data: s });
    }
    suppliers.push(existing);
  }
  console.log(`✅ ${suppliers.length} Supplier berhasil disiapkan.`);

  // 4. Member Pelanggan
  const membersData = [
    {
      kode: "MBR-001",
      nama: "Budi Santoso",
      telepon: "0857-1122-3344",
      alamat: "Jl. Melati No. 45, RT 02/05",
    },
    {
      kode: "MBR-002",
      nama: "Siti Nurhaliza",
      telepon: "0813-9988-7766",
      alamat: "Jl. Anggrek Raya No. 10",
    },
    {
      kode: "MBR-003",
      nama: "Ahmad Dahlan",
      telepon: "0878-5544-3322",
      alamat: "Perum Graha Indah Blok C2",
    },
  ];

  for (const m of membersData) {
    await db.member.upsert({
      where: { kode: m.kode },
      update: {},
      create: m,
    });
  }
  console.log(`✅ ${membersData.length} Member berhasil disiapkan.`);

  // 5. Barang & Varian
  const products = [
    {
      kode: "8992388111223",
      nama: "Indomie Mi Goreng Spesial 85g",
      stok: 120,
      hargaBeli: 2800,
      kategoriId: categories["Makanan & Minuman"]?.id,
      supplierId: suppliers[0]?.id,
      varians: [
        {
          unitId: units["Pcs"]?.id,
          konversi: 1,
          hargaRetail: 3500,
          hargaMember: 3300,
        },
        {
          unitId: units["Dus"]?.id,
          konversi: 40,
          hargaRetail: 135000,
          hargaMember: 130000,
        },
      ],
    },
    {
      kode: "8999999001234",
      nama: "Minyak Goreng Sania Pouch 2L",
      stok: 48,
      hargaBeli: 32000,
      kategoriId: categories["Sembako"]?.id,
      supplierId: suppliers[0]?.id,
      varians: [
        {
          unitId: units["Pcs"]?.id,
          konversi: 1,
          hargaRetail: 38000,
          hargaMember: 36500,
        },
        {
          unitId: units["Dus"]?.id,
          konversi: 6,
          hargaRetail: 222000,
          hargaMember: 215000,
        },
      ],
    },
    {
      kode: "8998866100123",
      nama: "Aqua Air Mineral Botol 600ml",
      stok: 72,
      hargaBeli: 2500,
      kategoriId: categories["Makanan & Minuman"]?.id,
      supplierId: suppliers[1]?.id,
      varians: [
        {
          unitId: units["Botol"]?.id || units["Pcs"]?.id,
          konversi: 1,
          hargaRetail: 3500,
          hargaMember: 3200,
        },
        {
          unitId: units["Dus"]?.id,
          konversi: 24,
          hargaRetail: 78000,
          hargaMember: 74000,
        },
      ],
    },
    {
      kode: "8993005123456",
      nama: "Kopi Kapal Api Spesial Mix 24g (Isi 10)",
      stok: 35,
      hargaBeli: 11000,
      kategoriId: categories["Makanan & Minuman"]?.id,
      supplierId: suppliers[1]?.id,
      varians: [
        {
          unitId: units["Pak"]?.id || units["Pcs"]?.id,
          konversi: 1,
          hargaRetail: 14000,
          hargaMember: 13200,
        },
      ],
    },
    {
      kode: "8991100223344",
      nama: "Sabun Cuci Piring Sunlight Jeruk Nipis 750ml",
      stok: 25,
      hargaBeli: 13500,
      kategoriId: categories["Kebutuhan Rumah Tangga"]?.id,
      supplierId: suppliers[0]?.id,
      varians: [
        {
          unitId: units["Pcs"]?.id,
          konversi: 1,
          hargaRetail: 17000,
          hargaMember: 16000,
        },
      ],
    },
  ];

  const createdProducts: any[] = [];
  for (const p of products) {
    let existing = await db.barang.findUnique({ where: { kode: p.kode } });
    if (!existing) {
      existing = await db.barang.create({
        data: {
          kode: p.kode,
          nama: p.nama,
          stok: p.stok,
          hargaBeli: p.hargaBeli,
          kategoriId: p.kategoriId,
          supplierId: p.supplierId,
          varians: {
            create: p.varians.map((v) => ({
              unitId: v.unitId,
              konversi: v.konversi,
              hargaRetail: v.hargaRetail,
              hargaMember: v.hargaMember,
            })),
          },
        },
      });
    }
    createdProducts.push(existing);
  }
  console.log(`✅ ${createdProducts.length} Produk Master + Varian berhasil disiapkan.`);

  // 6. Promo: Beli 5 Indomie Gratis 1 Indomie
  const indomie = createdProducts.find((p) => p.kode === "8992388111223");
  if (indomie) {
    const existingPromo = await db.promo.findFirst({
      where: { nama: "Promo Berkah: Beli 5 Mie Goreng Gratis 1" },
    });

    if (!existingPromo) {
      const now = new Date();
      const endOfYear = new Date();
      endOfYear.setFullYear(now.getFullYear() + 1);

      await db.promo.create({
        data: {
          nama: "Promo Berkah: Beli 5 Mie Goreng Gratis 1",
          tipe: "BUY_X_GET_Y",
          barangSyaratId: indomie.id,
          minBeliQty: 5,
          barangHadiahId: indomie.id,
          hadiahQty: 1,
          tanggalMulai: now,
          tanggalSelesai: endOfYear,
          isActive: true,
        },
      });
      console.log("✅ Promo default berhasil disiapkan.");
    }
  }

  console.log("🎉 Seeding database My POS selesai!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
