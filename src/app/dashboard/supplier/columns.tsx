"use client";

import { DeleteSupplierDialog } from "@/components/dialogs/delete-supplier-dialog";
import { EditSupplierDialog } from "@/components/dialogs/edit-supplier-dialog";
import { ColumnDef } from "@tanstack/react-table";

type Supplier = {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
};

export const columnsSupplier: ColumnDef<Supplier>[] = [
  {
    id: "no",
    header: "No",
    enableSorting: false,
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "nama",
    header: "Nama",
  },
  {
    accessorKey: "telepon",
    header: "Telepon",
    cell: ({ row }) => row.original.telepon ?? "-",
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
    cell: ({ row }) => row.original.alamat ?? "-",
  },
  {
    id: "actions",
    header: () => <div className="flex justify-end w-full">Aksi</div>,
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex justify-end gap-2">
          <EditSupplierDialog data={s} />
          <DeleteSupplierDialog id={s.id} nama={s.nama} />
        </div>
      );
    },
  },
];
