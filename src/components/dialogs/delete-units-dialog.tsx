"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteUnit } from "@/app/actions/units";
import { toast } from "sonner";
import { Trash2, AlertTriangle, RefreshCw } from "lucide-react";

export function DeleteUnitDialog({ id, name }: { id: string; name?: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteUnit(id);
        toast.success(`Satuan ${name ? `"${name}" ` : ""}berhasil dihapus.`);
        setOpen(false);
      } catch (err: any) {
        toast.error(err.message || "Gagal menghapus satuan.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-1.5 shadow-xs">
          <Trash2 className="w-3.5 h-3.5" />
          <span>Hapus</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Hapus Satuan
          </DialogTitle>
          <DialogDescription className="pt-2 text-foreground">
            Apakah Anda yakin ingin menghapus satuan {name ? <strong>"{name}"</strong> : "ini"}?
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Satuan yang masih digunakan oleh produk toko tidak dapat dihapus demi menjaga keutuhan data barang.
        </p>

        <DialogFooter className="gap-2 sm:gap-0 mt-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              "Ya, Hapus"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
