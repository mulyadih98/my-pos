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
import { updateBarangWithVarian } from "@/app/actions/barang";
import { BarangForm } from "../form/form-barang";

export function EditBarangDialog({ data, suppliers, units, categories }: any) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-blue-600 text-sm">Edit</button>
      </DialogTrigger>

      <DialogContent className="!max-w-none w-[95vw] lg:w-[80vw] max-h-[92vh] h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Edit Barang
          </DialogTitle>
          <DialogDescription>Ubah data barang dan variannya</DialogDescription>
        </DialogHeader>

        {/* FORM */}
        <BarangForm
          mode="edit"
          defaultValues={data}
          suppliers={suppliers}
          units={units}
          categories={categories}
          onCancel={() => setOpen(false)}
          onSubmit={async (form) => {
            await updateBarangWithVarian(data.id, form);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
