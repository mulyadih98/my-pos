"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createBarangWithVarian } from "@/app/actions/barang";
import { BarangForm } from "../form/form-barang";

export function AddBarangDialog({ suppliers, units, categories }: any) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Tambah Barang</Button>
      </DialogTrigger>

      <DialogContent className="!max-w-none w-[95vw] lg:w-[80vw] max-h-[92vh] h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Tambah Barang
          </DialogTitle>
          <DialogDescription>
            Tambahkan produk baru beserta varian
          </DialogDescription>
        </DialogHeader>

        {/* FORM */}
        <BarangForm
          mode="create"
          suppliers={suppliers}
          units={units}
          categories={categories}
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            await createBarangWithVarian(data);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
