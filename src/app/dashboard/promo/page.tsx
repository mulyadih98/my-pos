import { db } from "@/lib/db";
import { getPromos } from "@/app/actions/promo";
import { PromoTable } from "@/components/promo-table";

export default async function PromoPage() {
  const promos = await getPromos();
  const products = await db.barang.findMany({
    orderBy: { nama: "asc" },
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Program Promosi</h1>
      <PromoTable data={promos} products={products} />
    </div>
  );
}
