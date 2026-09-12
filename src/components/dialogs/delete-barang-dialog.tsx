"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteBarang } from "@/app/actions/barang";
import { toast } from "sonner";

export function DeleteBarangDialog({ id, nama }: { id: string; nama: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteBarang(id);
        toast.success(`Barang "${nama}" berhasil dihapus.`);
        setOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus barang.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-red-600 text-sm">Hapus</button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus Barang</DialogTitle>
          <DialogDescription>
            Yakin ingin menghapus <b>{nama}</b>? Tindakan ini tidak bisa
            dibatalkan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? "Menghapus..." : "Hapus"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
