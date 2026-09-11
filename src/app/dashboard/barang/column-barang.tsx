"use client";

import { DeleteBarangDialog } from "@/components/dialogs/delete-barang-dialog";
import { EditBarangDialog } from "@/components/dialogs/edit-barang-dialog";
import { Barang, Supplier, Unit } from "@/generated/prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";

export const columnsBarang = (
  suppliers: Supplier[],
  units: Unit[],
  categories: any[],
): ColumnDef<any>[] => [
  {
    id: "expand",
    header: "",
    cell: ({ row }) => (
      <button onClick={row.getToggleExpandedHandler()}>
        {row.getIsExpanded() ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>
    ),
  },
  {
    id: "no",
    header: "No",
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
  },
  {
    accessorKey: "nama",
    header: "Nama Barang",
    cell: ({ row }) => (
      <div>
        <span className="font-semibold text-foreground text-xs sm:text-sm block">
          {row.original.nama}
        </span>
        <div className="flex flex-wrap items-center gap-1 mt-0.5 sm:hidden text-[10px] text-muted-foreground font-mono">
          <span>{row.original.kode}</span>
          {row.original.kategori && <span>&bull; {row.original.kategori.nama}</span>}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "kode",
    header: () => <span className="hidden sm:inline">Kode Barcode</span>,
    cell: ({ row }) => (
      <span className="hidden sm:inline-block font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
        {row.original.kode}
      </span>
    ),
  },
  {
    id: "stok",
    header: "Stok",
    cell: ({ row }) => {
      const s = row.original.stok;
      return (
        <span
          className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full inline-block ${
            s <= 5
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-muted text-foreground"
          }`}
        >
          {s} pcs
        </span>
      );
    },
  },
  {
    id: "supplier",
    header: () => <span className="hidden md:inline">Supplier</span>,
    cell: ({ row }) => (
      <span className="hidden md:inline text-xs text-muted-foreground">
        {row.original.supplier?.nama ?? "-"}
      </span>
    ),
  },
  {
    id: "kategori",
    header: () => <span className="hidden lg:inline">Kategori</span>,
    cell: ({ row }) => (
      <span className="hidden lg:inline text-xs text-muted-foreground">
        {row.original.kategori?.nama ?? "-"}
      </span>
    ),
  },
  {
    id: "varian",
    header: () => <span className="hidden lg:inline">Varian</span>,
    cell: ({ row }) => (
      <span className="hidden lg:inline text-xs text-muted-foreground">
        {row.original.varians.length} Satuan
      </span>
    ),
  },
  {
    id: "aksi",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const data = row.original;
      return (
        <div className="flex justify-end gap-1.5">
          <EditBarangDialog 
            data={data} 
            suppliers={suppliers} 
            units={units} 
            categories={categories} 
          />
          <DeleteBarangDialog id={data.id} nama={data.nama} />
        </div>
      );
    },
  },
];
