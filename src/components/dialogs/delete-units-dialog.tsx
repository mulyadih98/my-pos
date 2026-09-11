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
import { deleteUnit } from "@/app/actions/units";

export function DeleteUnitDialog({ id }: { id: string }) {
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
          <DialogTitle>Hapus data?</DialogTitle>
        </DialogHeader>

        <form
          action={async (formData) => {
            await deleteUnit(formData);
            setOpen(false);
          }}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={id} />

          <Button type="submit" variant="destructive" className="w-full">
            Ya, hapus
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
