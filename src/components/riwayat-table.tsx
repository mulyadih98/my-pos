"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Receipt, User, Calendar, CreditCard, Printer } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ReceiptModal, ReceiptData } from "@/components/receipt-modal";

export function RiwayatTable({ data }: { data: any[] }) {
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleOpenReceipt = (tx: any) => {
    const receiptData: ReceiptData = {
      invoice: tx.invoice,
      total: tx.total,
      bayar: tx.bayar,
      kembali: tx.kembali,
      date: tx.createdAt,
      member: tx.member ? { nama: tx.member.nama, kode: tx.member.kode } : null,
      items: tx.items.map((item: any) => ({
        nama: item.barang?.nama || "Produk",
        unitName: item.varian?.unit?.name || "Pcs",
        qty: item.qty,
        harga: item.hargaJual,
        isBonus: item.isBonus,
        bonusLabel: item.promo?.nama || "Bonus",
      })),
    };
    setSelectedReceipt(receiptData);
    setIsReceiptOpen(true);
  };
  const columns: ColumnDef<any>[] = [
    {
      id: "expand",
      header: "",
      cell: ({ row }) => (
        <button onClick={row.getToggleExpandedHandler()} className="p-1 hover:bg-muted rounded">
          {row.getIsExpanded() ? (
            <ChevronDown size={18} className="text-primary" />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      ),
    },
    {
      accessorKey: "invoice",
      header: "Invoice",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          <span className="font-mono font-bold">{row.original.invoice}</span>
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{date.toLocaleDateString('id-ID')}</span>
            <span className="text-xs text-muted-foreground">{date.toLocaleTimeString('id-ID')}</span>
          </div>
        );
      }
    },
    {
      accessorFn: (row) => row.member?.nama || "Umum (Retail)",
      id: "member",
      header: "Pelanggan",
      cell: ({ row }) => {
        const member = row.original.member;
        return (
          <div className="flex items-center gap-2">
            <User className={`w-4 h-4 ${member ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={member ? 'font-medium' : 'text-muted-foreground text-sm'}>
              {member ? member.nama : 'Umum (Retail)'}
            </span>
          </div>
        );
      }
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-bold text-primary">
          Rp {row.original.total.toLocaleString()}
        </span>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: () => <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase">Lunas</span>
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReceipt(tx);
              }}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak Struk
            </Button>
          </div>
        );
      },
    },
  ];

  const renderItems = (row: any) => {
    const items = row.original.items;
    return (
      <div className="p-4 bg-muted/20 border-y space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detail Barang</h4>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none h-8">
              <TableHead className="h-8 text-xs">Barang</TableHead>
              <TableHead className="h-8 text-xs text-right">Harga</TableHead>
              <TableHead className="h-8 text-xs text-center">Qty</TableHead>
              <TableHead className="h-8 text-xs text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow 
                key={item.id} 
                className={`hover:bg-transparent border-none h-10 ${item.isBonus ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
              >
                <TableCell className="py-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm">{item.barang.nama}</p>
                    {item.isBonus && (
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-400/50 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.promo ? `PROMO: ${item.promo.nama}` : "GRATIS / BONUS"}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{item.varian?.unit?.name || "Pcs"}</p>
                </TableCell>
                <TableCell className="py-1 text-right text-sm">
                  {item.isBonus ? (
                    <span className="text-emerald-600 font-semibold">Rp 0 (Bonus)</span>
                  ) : (
                    `Rp ${item.hargaJual.toLocaleString('id-ID')}`
                  )}
                </TableCell>
                <TableCell className="py-1 text-center text-sm font-semibold">{item.qty}</TableCell>
                <TableCell className="py-1 text-right font-semibold text-sm">
                  {item.isBonus ? (
                    <span className="text-emerald-600 font-bold">Rp 0</span>
                  ) : (
                    `Rp ${item.subtotal.toLocaleString('id-ID')}`
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-end gap-10 pt-2 border-t border-dashed">
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Bayar</p>
                <p className="font-medium">Rp {row.original.bayar.toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Kembali</p>
                <p className="font-medium text-green-600">Rp {row.original.kembali.toLocaleString()}</p>
            </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <DataTable 
        columns={columns} 
        data={data} 
        renderSubComponent={renderItems}
      />

      <ReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={selectedReceipt}
        onNewTransaction={() => setIsReceiptOpen(false)}
      />
    </>
  );
}
