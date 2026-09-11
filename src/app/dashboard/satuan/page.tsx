import { DataTable } from "@/components/data-table";
import { db } from "@/lib/db";
import { columnsUnit } from "./columns";
import { Card, CardContent } from "@/components/ui/card";
import { AddUnitDialog } from "@/components/dialogs/add-units-dialog";

export default async function Page() {
  const units = await db.unit.findMany();

  return (
    <div className="p-3 sm:p-6 space-y-4 w-full">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Satuan</h1>
      <Card>
        <CardContent className="p-4">
          <DataTable
            columns={columnsUnit}
            data={units}
            toolbar={<AddUnitDialog />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
