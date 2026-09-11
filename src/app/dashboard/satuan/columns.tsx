"use client";

import { DeleteUnitDialog } from "@/components/dialogs/delete-units-dialog";
import { EditUnitDialog } from "@/components/dialogs/edit-units-dialog";
import { ColumnDef } from "@tanstack/react-table";

type Unit = {
  id: string;
  name: string;
};

export const columnsUnit: ColumnDef<Unit>[] = [
  {
    id: "no",
    header: "No",
    enableSorting: false,
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.original.id.slice(0, 8) + "...",
  },
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    id: "actions",
    size: 150,
    header: () => <div className="flex justify-end w-full">Aksi</div>,
    cell: ({ row }) => {
      const data = row.original;

      return (
        <div className="flex justify-end w-full gap-2">
          <EditUnitDialog id={data.id} defaultValue={data.name} />
          <DeleteUnitDialog id={data.id} />
        </div>
      );
    },
  },
];
