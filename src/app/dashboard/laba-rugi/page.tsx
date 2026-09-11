import { getLaporanLabaRugi } from "@/app/actions/laba-rugi";
import { LabaRugiClient } from "@/components/laba-rugi/laba-rugi-client";

export default async function LabaRugiPage() {
  const initialData = await getLaporanLabaRugi();

  return (
    <div className="p-3 sm:p-6 space-y-6 w-full">
      <div className="print:hidden">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Laporan Laba Rugi</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Analisis komprehensif omset penjualan, modal pokok barang (HPP), penyesuaian inventori, dan keuntungan bersih toko.
        </p>
      </div>

      <LabaRugiClient initialData={initialData} />
    </div>
  );
}
