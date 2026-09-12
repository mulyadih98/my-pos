import { getBiayaOperasional } from "@/app/actions/operasional";
import { OperasionalTable } from "@/components/operasional/operasional-table";
import { Wallet } from "lucide-react";

export const metadata = {
  title: "Biaya Operasional - My POS",
  description: "Pencatatan beban dan pengeluaran operasional toko",
};

export default async function OperasionalPage() {
  const data = await getBiayaOperasional();

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Biaya Operasional Toko
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Catat dan pantau seluruh beban pengeluaran operasional (listrik, gaji, sewa, perlengkapan) yang terintegrasi dengan Laporan Laba Rugi.
          </p>
        </div>
      </div>

      <OperasionalTable initialData={data.list as any} summary={data.summary} />
    </div>
  );
}
