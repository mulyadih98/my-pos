import { getPengaturanDefault } from "@/app/actions/pengaturan";
import { PengaturanClient } from "@/components/pengaturan/pengaturan-client";

export default async function PengaturanPage() {
  const defaultSettings = await getPengaturanDefault();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Toko & Printer</h1>
        <p className="text-muted-foreground text-sm">
          Atur informasi nama toko, alamat, struk kasir, serta hubungkan printer thermal Anda.
        </p>
      </div>

      <PengaturanClient defaultSettings={defaultSettings} />
    </div>
  );
}
