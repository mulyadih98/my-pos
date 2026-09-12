import { getUsers } from "@/app/actions/user";
import { UserTable } from "@/components/user/user-table";
import { UsersIcon } from "lucide-react";

export const metadata = {
  title: "Manajemen Pengguna - My POS",
  description: "Kelola akun pengguna, kasir, dan hak akses sistem POS",
};

export default async function UserManagementPage() {
  const users = await getUsers();

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-primary" />
            Manajemen Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Daftar seluruh akun pemilik toko dan kasir yang memiliki akses ke sistem My POS.
          </p>
        </div>
      </div>

      <UserTable data={users as any} />
    </div>
  );
}
