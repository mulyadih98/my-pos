import { db } from "@/lib/db";
import { DataTable } from "@/components/data-table";
import { columnsSupplier } from "./columns";
import { AddSupplierDialog } from "@/components/dialogs/add-supplier-dialog";

export default async function Page() {
  const suppliers = await db.supplier.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Supplier</h1>

      <DataTable
        columns={columnsSupplier}
        data={suppliers}
        toolbar={<AddSupplierDialog />}
      />
    </div>
  );
}
