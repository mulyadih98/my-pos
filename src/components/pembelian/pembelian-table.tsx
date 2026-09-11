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
import { Trash2, Eye, Building2, Calendar, FileText, PackageCheck, AlertTriangle } from "lucide-react";
import { deletePembelian } from "@/app/actions/pembelian";
import { toast } from "sonner";
import { AddPembelianDialog } from "./add-pembelian-dialog";

interface PembelianTableProps {
  data: any[];
  suppliers: any[];
  products: any[];
}

export function PembelianTable({ data, suppliers, products }: PembelianTableProps) {
  const [viewingPembelian, setViewingPembelian] = useState<any>(null);

  const handleDelete = async (id: string, noFaktur: string) => {
    if (
      confirm(
        `PERINGATAN: Menghapus faktur "${noFaktur}" akan OTOMATIS MENGURANGI KEMBALI stok fisik barang yang sempat bertambah dari faktur ini.\n\nApakah Anda yakin ingin menghapus?`
      )
    ) {
      try {
        await deletePembelian(id);
        toast.success(`Faktur ${noFaktur} berhasil dihapus & stok telah di-rollback.`);
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus faktur pembelian");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "noFaktur",
      header: "No. Faktur",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold font-mono text-sm text-foreground">
            <FileText className="w-3.5 h-3.5 text-primary" />
            <span>{row.original.noFaktur}</span>
          </div>
          {row.original.catatan && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
              {row.original.catatan}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Supplier",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-xs text-foreground">{row.original.supplier?.nama || "-"}</p>
            <p className="text-[10px] text-muted-foreground">{row.original.supplier?.telepon || ""}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tanggal",
      header: "Tanggal Terima",
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
      id: "itemCount",
      header: "Jumlah Barang",
      cell: ({ row }) => {
        const totalItems = row.original.items?.length || 0;
        const totalPcs = row.original.items?.reduce(
          (acc: number, item: any) => acc + item.qty * item.konversi,
          0
        ) || 0;

        return (
          <div className="text-xs">
            <span className="font-semibold text-foreground">{totalItems} Jenis Barang</span>
            <span className="text-[11px] text-muted-foreground block">
              Total: +{totalPcs} Pcs
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total Biaya Faktur",
      cell: ({ row }) => (
        <span className="font-bold text-sm text-primary font-mono">
          Rp {row.original.total.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewingPembelian(row.original)}
            className="h-8 w-8 text-primary hover:bg-primary/10"
            title="Lihat Rincian Barang"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id, row.original.noFaktur)}
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
          <h2 className="text-xl font-bold">Riwayat Stok Masuk / Pembelian</h2>
          <p className="text-xs text-muted-foreground">
            Daftar penerimaan barang dari supplier & mutasi penambahan stok gudang.
          </p>
        </div>

        <AddPembelianDialog suppliers={suppliers} products={products} />
      </div>

      <DataTable columns={columns} data={data} />

      {/* Dialog Detail Rincian Faktur */}
      <Dialog open={!!viewingPembelian} onOpenChange={(open) => !open && setViewingPembelian(null)}>
        <DialogContent className="max-w-2xl p-6">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-primary" /> Rincian Faktur #{viewingPembelian?.noFaktur}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Supplier: <strong>{viewingPembelian?.supplier?.nama}</strong> &bull; Tanggal Terima:{" "}
              {viewingPembelian &&
                new Date(viewingPembelian.tanggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {viewingPembelian?.catatan && (
              <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground border">
                <strong>Catatan:</strong> {viewingPembelian.catatan}
              </div>
            )}

            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="p-3">Nama Produk</th>
                    <th className="p-3 text-center">Qty Diterima</th>
                    <th className="p-3 text-right">Harga Modal Beli</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewingPembelian?.items?.map((item: any) => {
                    const totalPcs = item.qty * item.konversi;
                    return (
                      <tr key={item.id}>
                        <td className="p-3">
                          <p className="font-semibold text-foreground">{item.barang?.nama}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {item.barang?.kode} &bull; Bertambah +{totalPcs} pcs
                          </p>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold">{item.qty}</span> {item.unit?.name || "Pcs"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          Rp {item.hargaBeli.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold">
                          Rp {item.subtotal.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Total Biaya Faktur
              </span>
              <span className="text-xl font-black text-primary font-mono">
                Rp {viewingPembelian?.total?.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
