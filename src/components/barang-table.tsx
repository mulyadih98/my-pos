/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/data-table";
import { VarianTable } from "./varian-table";
import { columnsBarang } from "@/app/dashboard/barang/column-barang";
import { AddBarangDialog } from "./dialogs/add-barang-dialog";

export function BarangTable({ data, suppliers, units, categories, isOwner = true }: any) {
  return (
    <DataTable
      columns={columnsBarang(suppliers, units, categories, isOwner)}
      data={data}
      toolbar={isOwner ? <AddBarangDialog suppliers={suppliers} units={units} categories={categories} /> : undefined}
      renderSubComponent={(row) => (
        <VarianTable varians={row.original.varians} />
      )}
    />
  );
}
