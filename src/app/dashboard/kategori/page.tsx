import { getKategori } from "@/app/actions/kategori";
import { KategoriTable } from "@/components/kategori-table";

export default async function KategoriPage() {
  const data = await getKategori();

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Kategori</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Kelola kategori barang untuk pengelompokan produk yang lebih baik.
        </p>
      </div>

      <KategoriTable data={data} />
    </div>
  );
}
