"use client";

import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus } from "lucide-react";
import { createKategori, updateKategori, deleteKategori } from "@/app/actions/kategori";
import { toast } from "sonner";

export function KategoriTable({ data }: { data: any[] }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingKategori, setEditingKategori] = useState<any>(null);
  const [nama, setNama] = useState("");

  const handleAdd = async () => {
    try {
      await createKategori(nama);
      setNama("");
      setIsAddOpen(false);
      toast.success("Kategori berhasil ditambahkan");
    } catch (error) {
      toast.error("Gagal menambah kategori");
    }
  };

  const handleUpdate = async () => {
    try {
      await updateKategori(editingKategori.id, nama);
      setEditingKategori(null);
      setNama("");
      toast.success("Kategori berhasil diperbarui");
    } catch (error) {
      toast.error("Gagal memperbarui kategori");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus kategori ini? Barang dengan kategori ini akan menjadi tidak berkategori.")) {
      try {
        await deleteKategori(id);
        toast.success("Kategori berhasil dihapus");
      } catch (error: any) {
        toast.error(error.message || "Gagal menghapus kategori");
      }
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "nama",
      header: "Nama Kategori",
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditingKategori(row.original);
              setNama(row.original.nama);
            }}
          >
            <Edit className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Daftar Kategori</h2>
        
        {/* Dialog Tambah */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-1 block">Nama Kategori</label>
              <Input 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                placeholder="Misal: Minuman Dingin"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Batal</Button>
              <Button onClick={handleAdd} disabled={!nama}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={data} />

      {/* Dialog Edit */}
      <Dialog open={!!editingKategori} onOpenChange={(open) => !open && setEditingKategori(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">Nama Kategori</label>
            <Input 
              value={nama} 
              onChange={(e) => setNama(e.target.value)} 
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingKategori(null)}>Batal</Button>
            <Button onClick={handleUpdate} disabled={!nama}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
