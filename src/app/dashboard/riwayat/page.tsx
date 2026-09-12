import { getTransaksi } from "@/app/actions/transaksi";
import { RiwayatTable } from "@/components/riwayat-table";
import { getCurrentUser } from "@/lib/auth";

export default async function RiwayatPage() {
  const [transactions, user] = await Promise.all([
    getTransaksi(),
    getCurrentUser(),
  ]);

  const isOwner = user?.role === "OWNER";

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Daftar seluruh transaksi penjualan yang telah dilakukan.</p>
        </div>
      </div>
      <RiwayatTable data={transactions} isOwner={isOwner} />
    </div>
  );
}
