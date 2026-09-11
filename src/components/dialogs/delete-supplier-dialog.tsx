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
import { deleteSupplier } from "@/app/actions/supplier";

export function DeleteSupplierDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Hapus
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus supplier?</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            await deleteSupplier(formData);
            setOpen(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={id} />

          <p className="text-sm text-muted-foreground">
            Data yang dihapus tidak bisa dikembalikan.
          </p>

          <Button type="submit" variant="destructive" className="w-full">
            Ya, hapus
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
