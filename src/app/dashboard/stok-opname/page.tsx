import { getStokOpnameList } from "@/app/actions/stok-opname";
import { db } from "@/lib/db";
import { StokOpnameTable } from "@/components/stok-opname/stok-opname-table";

export default async function StokOpnamePage() {
  const [opnameList, products] = await Promise.all([
    getStokOpnameList(),
    db.barang.findMany({
      select: {
        id: true,
        nama: true,
        kode: true,
        stok: true,
        hargaBeli: true,
      },
      orderBy: { nama: "asc" },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <StokOpnameTable data={opnameList} products={products} />
    </div>
  );
}
