"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, Eye, Calendar, FileText, ClipboardList, AlertOctagon } from "lucide-react";
import { deleteStokOpname } from "@/app/actions/stok-opname";
import { toast } from "sonner";
import { AddStokOpnameDialog } from "./add-stok-opname-dialog";

interface StokOpnameTableProps {
  data: any[];
  products: any[];
}

export function StokOpnameTable({ data, products }: StokOpnameTableProps) {
  const [viewingOpname, setViewingOpname] = useState<any>(null);

  const handleDelete = async (id: string, kodeOpname: string) => {
    if (
      confirm(
        `PERINGATAN: Menghapus dokumen "${kodeOpname}" akan OTOMATIS MENGEMBALIKAN stok fisik master barang ke kondisi sebelum opname ini dibuat.\n\nApakah Anda yakin ingin menghapus?`
      )
    ) {
      try {
        await deleteStokOpname(id);
        toast.success(`Dokumen ${kodeOpname} berhasil dihapus & stok telah di-rollback.`);
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus dokumen stok opname");
      }
    }
  };

  const getAlasanBadge = (alasan: string) => {
    switch (alasan) {
      case "RUSAK":
        return <span className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">🛑 Rusak / Pecah</span>;
      case "KADALUARSA":
        return <span className="bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">⏳ Kadaluarsa (Expired)</span>;
      case "HILANG":
        return <span className="bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold">🔍 Hilang / Selisih</span>;
      case "KOREKSI_TAMBAH":
        return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">📦 Koreksi Tambahan</span>;
      default:
        return <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-bold">📝 Lainnya</span>;
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "kodeOpname",
      header: "No. Dokumen",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-foreground">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>{row.original.kodeOpname}</span>
          </div>
          {row.original.keterangan && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[220px]">
              {row.original.keterangan}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal Opname",
      cell: ({ row }) => {
        const date = new Date(row.original.tanggal).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>{date}</span>
          </div>
        );
      },
    },
    {
      id: "itemsSummary",
      header: "Ringkasan Selisih",
      cell: ({ row }) => {
        const totalItems = row.original.items?.length || 0;
        const totalSelisih = row.original.items?.reduce(
          (acc: number, item: any) => acc + item.selisih,
          0
        ) || 0;
        const isMinus = totalSelisih < 0;
        const isPlus = totalSelisih > 0;

        return (
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-foreground block">{totalItems} Produk Disesuaikan</span>
            <span
              className={`font-mono font-bold ${
                isMinus ? "text-red-600 dark:text-red-400" : isPlus ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`}
            >
              {isPlus ? `+${totalSelisih}` : totalSelisih} pcs
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalSelisihNilai",
      header: "Nilai Kerugian / Selisih",
      cell: ({ row }) => {
        const val = row.original.totalSelisihNilai;
        const isMinus = val < 0;
        return (
          <span className={`font-bold text-sm font-mono ${isMinus ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
            {isMinus ? `-Rp ${Math.abs(val).toLocaleString("id-ID")}` : `Rp ${val.toLocaleString("id-ID")}`}
          </span>
        );
      },
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewingOpname(row.original)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
            title="Lihat Rincian Opname"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id, row.original.kodeOpname)}
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            title="Hapus & Rollback Stok"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold">Stok Opname & Penyesuaian Inventori</h2>
          <p className="text-xs text-muted-foreground">
            Audit pencocokan fisik toko vs sistem, pencatatan barang rusak/kadaluarsa, dan rekap nilai kerugian.
          </p>
        </div>

        <AddStokOpnameDialog products={products} />
      </div>

      <DataTable columns={columns} data={data} />

      {/* Dialog Detail Rincian Opname */}
      <Dialog open={!!viewingOpname} onOpenChange={(open) => !open && setViewingOpname(null)}>
        <DialogContent className="max-w-3xl p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" /> Rincian Penyesuaian #{viewingOpname?.kodeOpname}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tanggal Opname:{" "}
              {viewingOpname &&
                new Date(viewingOpname.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {viewingOpname?.keterangan && (
              <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground border">
                <strong>Keterangan:</strong> {viewingOpname.keterangan}
              </div>
            )}

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Produk</th>
                    <th className="p-3 text-center">Stok Awal</th>
                    <th className="p-3 text-center">Hasil Fisik</th>
                    <th className="p-3 text-center">Selisih</th>
                    <th className="p-3">Alasan</th>
                    <th className="p-3 text-right">Nilai Selisih</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewingOpname?.items?.map((item: any) => {
                    const isMinus = item.selisih < 0;
                    const isPlus = item.selisih > 0;
                    return (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{item.barang?.nama}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.barang?.kode}
                          </p>
                        </td>
                        <td className="p-3 text-center font-mono text-muted-foreground">
                          {item.stokSistem} pcs
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-foreground">
                          {item.stokFisik} pcs
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`font-bold font-mono ${
                              isMinus ? "text-red-600" : isPlus ? "text-emerald-600" : "text-muted-foreground"
                            }`}
                          >
                            {isPlus ? `+${item.selisih}` : item.selisih} pcs
                          </span>
                        </td>
                        <td className="p-3">
                          {getAlasanBadge(item.alasan)}
                          {item.catatan && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {item.catatan}
                            </span>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${isMinus ? "text-red-600" : isPlus ? "text-emerald-600" : "text-muted-foreground"}`}>
                          {item.nilaiSelisih < 0 ? `-Rp ${Math.abs(item.nilaiSelisih).toLocaleString("id-ID")}` : `Rp ${item.nilaiSelisih.toLocaleString("id-ID")}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={`p-3 rounded-xl border flex items-center justify-between ${viewingOpname?.totalSelisihNilai < 0 ? "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40" : "bg-primary/5 border-primary/20"}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {viewingOpname?.totalSelisihNilai < 0 ? "Estimasi Kerugian (Waste)" : "Total Nilai Penyesuaian"}
              </span>
              <span className={`text-xl font-black font-mono ${viewingOpname?.totalSelisihNilai < 0 ? "text-red-600 dark:text-red-400" : "text-primary"}`}>
                {viewingOpname?.totalSelisihNilai < 0 ? `-Rp ${Math.abs(viewingOpname.totalSelisihNilai).toLocaleString("id-ID")}` : `Rp ${viewingOpname?.totalSelisihNilai?.toLocaleString("id-ID")}`}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
