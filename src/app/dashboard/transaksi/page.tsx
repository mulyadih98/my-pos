import { getBarangForPOS } from "@/app/actions/barang";
import { getActivePromos } from "@/app/actions/promo";
import POSClient from "./pos-client";
import { db } from "@/lib/db";

export default async function TransaksiPage() {
  const products = await getBarangForPOS();
  const members = await db.member.findMany({
    orderBy: { nama: 'asc' }
  });
  const activePromos = await getActivePromos();

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 p-1.5 sm:p-2.5 lg:h-[calc(100vh-3.75rem)] lg:overflow-hidden min-h-screen lg:min-h-0">
      <div className="hidden sm:flex lg:hidden items-center justify-between shrink-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">Transaksi Kasir</h1>
      </div>
      <div className="flex-1 min-h-0 lg:overflow-hidden">
        <POSClient 
          initialProducts={products} 
          initialMembers={members} 
          initialPromos={activePromos} 
        />
      </div>
    </div>
  );
}
