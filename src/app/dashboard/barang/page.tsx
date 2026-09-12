import { db } from "@/lib/db";
import { BarangTable } from "@/components/barang-table";
import { getCurrentUser } from "@/lib/auth";

export default async function Page() {
  const [barang, suppliers, units, categories, user] = await Promise.all([
    db.barang.findMany({
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
    }),
    db.supplier.findMany(),
    db.unit.findMany(),
    db.kategori.findMany(),
    getCurrentUser(),
  ]);

  const isOwner = user?.role === "OWNER";

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Barang</h1>

      <BarangTable
        data={barang}
        suppliers={suppliers}
        units={units}
        categories={categories}
        isOwner={isOwner}
      />
    </div>
  );
}
