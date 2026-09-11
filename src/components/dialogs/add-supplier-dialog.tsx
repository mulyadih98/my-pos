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
import { createSupplier } from "@/app/actions/supplier";

export function AddSupplierDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">+ Tambah</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Supplier</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            await createSupplier(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <Input name="nama" placeholder="Nama supplier" />
          <Input name="telepon" placeholder="Telepon" />
          <Input name="alamat" placeholder="Alamat" />

          <Button type="submit" className="w-full">
            Simpan
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
