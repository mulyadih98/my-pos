/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DataTable } from "@/components/data-table";
import { VarianTable } from "./varian-table";
import { columnsBarang } from "@/app/dashboard/barang/column-barang";
import { AddBarangDialog } from "./dialogs/add-barang-dialog";

export function BarangTable({ data, suppliers, units, categories }: any) {
  return (
    <DataTable
      //   columns={columnsBarang}
      columns={columnsBarang(suppliers, units, categories)}
      data={data}
      toolbar={<AddBarangDialog suppliers={suppliers} units={units} categories={categories} />}
      renderSubComponent={(row) => (
        <VarianTable varians={row.original.varians} />
      )}
    />
  );
}
