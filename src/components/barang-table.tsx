/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/data-table";
import { VarianTable } from "./varian-table";
import { columnsBarang } from "@/app/dashboard/barang/column-barang";
import { AddBarangDialog } from "./dialogs/add-barang-dialog";
import { ImportBarangDialog } from "./dialogs/import-barang-dialog";

export function BarangTable({ data, suppliers, units, categories, isOwner = true }: any) {
  return (
    <DataTable
      columns={columnsBarang(suppliers, units, categories, isOwner)}
      data={data}
      toolbar={
        isOwner ? (
          <div className="flex items-center gap-2">
            <ImportBarangDialog />
            <AddBarangDialog suppliers={suppliers} units={units} categories={categories} />
          </div>
        ) : undefined
      }
      renderSubComponent={(row) => (
        <VarianTable varians={row.original.varians} />
      )}
    />
  );
}
