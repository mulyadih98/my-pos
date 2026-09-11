"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteMember } from "@/app/actions/member";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteMemberDialog({ id, nama }: { id: string, nama: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMember(id);
      toast.success("Member berhasil dihapus");
      setOpen(false);
    } catch (error) {
      toast.error("Gagal menghapus member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Hapus Member
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center space-y-2">
          <p>Apakah Anda yakin ingin menghapus member <strong>{nama}</strong>?</p>
          <p className="text-sm text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
