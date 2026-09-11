import { getMembers } from "@/app/actions/member";
import { MemberTable } from "@/components/member-table";

export default async function MemberPage() {
  const members = await getMembers();

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Member</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Kelola data pelanggan setia toko Anda.</p>
        </div>
      </div>
      <MemberTable data={members} />
    </div>
  );
}
