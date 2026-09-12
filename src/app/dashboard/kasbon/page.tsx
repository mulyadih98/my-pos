import { getDaftarKasbon } from "@/app/actions/kasbon";
import { KasbonTable } from "@/components/kasbon/kasbon-table";
import { BookOpenCheck } from "lucide-react";

export default async function KasbonPage() {
  const data = await getDaftarKasbon();

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-amber-500" />
            Buku Kasbon / Piutang Toko
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Kelola saldo piutang berjalan pelanggan, riwayat belanja kasbon, dan pencatatan cicilan tunai/non-tunai.
          </p>
        </div>
      </div>

      <KasbonTable initialData={data.list} summary={data.summary} />
    </div>
  );
}
