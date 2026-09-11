"use client";

import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin } from "lucide-react";
import { AddMemberDialog } from "./dialogs/add-member-dialog";
import { DeleteMemberDialog } from "./dialogs/delete-member-dialog";
import { EditMemberDialog } from "./dialogs/edit-member-dialog";

export function MemberTable({ data }: { data: any[] }) {
  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "kode",
      header: "ID Member",
      cell: ({ row }) => <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">{row.original.kode}</code>
    },
    {
      accessorKey: "nama",
      header: "Nama Lengkap",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-full">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold">{row.original.nama}</span>
        </div>
      )
    },
    {
      accessorKey: "telepon",
      header: "Telepon",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="w-3.5 h-3.5" />
          <span>{row.original.telepon || "-"}</span>
        </div>
      )
    },
    {
      accessorKey: "alamat",
      header: "Alamat",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[200px]">
          <MapPin className="w-3.5 h-3.5" />
          <span>{row.original.alamat || "-"}</span>
        </div>
      )
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <EditMemberDialog data={row.original} />
          <DeleteMemberDialog id={row.original.id} nama={row.original.nama} />
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      toolbar={<AddMemberDialog />}
    />
  );
}
