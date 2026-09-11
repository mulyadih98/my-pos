import { db } from "@/lib/db";
import { BarangTable } from "@/components/barang-table";

export default async function Page() {
  const barang = await db.barang.findMany({
    include: {
      supplier: true,
      varians: {
        include: {
          unit: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const suppliers = await db.supplier.findMany();
  const units = await db.unit.findMany();
  const categories = await db.kategori.findMany();

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Barang</h1>

      <BarangTable data={barang} suppliers={suppliers} units={units} categories={categories} />
    </div>
  );
}
