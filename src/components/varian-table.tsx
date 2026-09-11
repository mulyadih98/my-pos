/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);
}

export function VarianTable({ varians }: { varians: any[] }) {
  if (!varians || varians.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Tidak ada varian</div>
    );
  }

  return (
    <div className="p-4 bg-muted/40 rounded-lg border">
      <div className="mb-3 text-sm font-medium">
        Daftar Varian ({varians.length})
      </div>

      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Unit</TableHead>
            <TableHead>Harga Retail</TableHead>
            <TableHead>Harga Member</TableHead>
            <TableHead>Konversi</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {varians.map((v) => (
            <TableRow key={v.id} className="hover:bg-muted/30">
              <TableCell className="font-medium">{v.unit?.name}</TableCell>

              <TableCell>{formatRupiah(v.hargaRetail)}</TableCell>

              <TableCell>{formatRupiah(v.hargaMember)}</TableCell>

              <TableCell>{v.konversi}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
