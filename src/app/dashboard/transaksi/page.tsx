import { getBarangForPOS } from "@/app/actions/barang";
import { getActivePromos } from "@/app/actions/promo";
import POSClient from "./pos-client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export default async function TransaksiPage() {
  const [products, members, activePromos, user] = await Promise.all([
    getBarangForPOS(),
    db.member.findMany({
      orderBy: { nama: "asc" },
    }),
    getActivePromos(),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-col gap-1 sm:gap-1.5 p-1 sm:p-2 lg:h-[calc(100dvh-5.5rem)] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-hidden min-h-screen lg:min-h-0">
      <div className="hidden sm:flex lg:hidden items-center justify-between shrink-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">Transaksi Kasir</h1>
      </div>
      <div className="flex-1 min-h-0 lg:overflow-hidden">
        <POSClient 
          initialProducts={products} 
          initialMembers={members} 
          initialPromos={activePromos}
          currentUser={user}
        />
      </div>
    </div>
  );
}
