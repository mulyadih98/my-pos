import { getPembelianList } from "@/app/actions/pembelian";
import { getBarangForPOS } from "@/app/actions/barang";
import { db } from "@/lib/db";
import { PembelianTable } from "@/components/pembelian/pembelian-table";

export default async function PembelianPage() {
  const [pembelianList, suppliers, products] = await Promise.all([
    getPembelianList(),
    db.supplier.findMany({ orderBy: { nama: "asc" } }),
    getBarangForPOS(),
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      <PembelianTable
        data={pembelianList}
        suppliers={suppliers}
        products={products as any}
      />
    </div>
  );
}
