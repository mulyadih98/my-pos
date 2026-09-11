"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateSupplier } from "@/app/actions/supplier";

type Supplier = {
  id: string;
  nama: string;
  telepon?: string | null;
  alamat?: string | null;
};

export function EditSupplierDialog({ data }: { data: Supplier }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            await updateSupplier(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={data.id} />

          <Input name="nama" defaultValue={data.nama} />
          <Input name="telepon" defaultValue={data.telepon ?? ""} />
          <Input name="alamat" defaultValue={data.alamat ?? ""} />

          <Button type="submit" className="w-full">
            Simpan Perubahan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
