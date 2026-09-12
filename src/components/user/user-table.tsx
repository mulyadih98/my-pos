"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  ShieldCheck,
  ShoppingBag,
  Phone,
  Key,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/app/actions/user";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UserItem {
  id: string;
  username: string;
  nama: string;
  role: string;
  isActive: boolean;
  telepon: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count: {
    transaksi: number;
    biayaOperasional: number;
  };
}

export function UserTable({ data }: { data: UserItem[] }) {
  const router = useRouter();

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Form States
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "KASIR">("KASIR");
  const [telepon, setTelepon] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createUser({
        username,
        nama,
        password,
        role,
        telepon,
      });
      toast.success(`Pengguna "${nama}" berhasil ditambahkan!`);
      setIsAddOpen(false);
      setUsername("");
      setNama("");
      setPassword("");
      setRole("KASIR");
      setTelepon("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Dialog
  const openEdit = (user: UserItem) => {
    setSelectedUser(user);
    setNama(user.nama);
    setRole(user.role as "OWNER" | "KASIR");
    setTelepon(user.telepon || "");
    setIsActive(user.isActive);
    setIsEditOpen(true);
  };

  // Handle Edit User
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await updateUser(selectedUser.id, {
        nama,
        role,
        telepon,
        isActive,
      });
      toast.success(`Data pengguna "${nama}" berhasil diperbarui!`);
      setIsEditOpen(false);
      setSelectedUser(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await updateUser(selectedUser.id, {
        password: newPassword,
      });
      toast.success(`Password untuk "${selectedUser.nama}" berhasil diubah!`);
      setIsPasswordOpen(false);
      setSelectedUser(null);
      setNewPassword("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengubah password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete User
  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus akun "${user.nama}" (@${user.username})?`)) {
      return;
    }

    try {
      const res = await deleteUser(user.id);
      toast.success(res.message);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus akun pengguna.");
    }
  };

  const columns: ColumnDef<UserItem>[] = [
    {
      id: "no",
      header: "No",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.index + 1}</span>,
    },
    {
      accessorKey: "nama",
      header: "Nama & Username",
      cell: ({ row }) => {
        const u = row.original;
        const isOwner = u.role === "OWNER";
        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isOwner
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
              }`}
            >
              {isOwner ? <ShieldCheck className="size-4" /> : <ShoppingBag className="size-4" />}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground leading-tight">{u.nama}</p>
              <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Peran (Role)",
      cell: ({ row }) => {
        const isOwner = row.original.role === "OWNER";
        return isOwner ? (
          <Badge className="bg-primary text-primary-foreground font-bold text-xs gap-1">
            <ShieldCheck className="w-3 h-3" /> OWNER / ADMIN
          </Badge>
        ) : (
          <Badge variant="secondary" className="font-bold text-xs gap-1">
            <ShoppingBag className="w-3 h-3 text-blue-600" /> KASIR
          </Badge>
        );
      },
    },
    {
      accessorKey: "telepon",
      header: "Telepon",
      cell: ({ row }) => {
        const telp = row.original.telepon;
        return telp ? (
          <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3" /> {telp}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">-</span>
        );
      },
    },
    {
      accessorKey: "_count",
      header: "Transaksi Dilayani",
      cell: ({ row }) => (
        <span className="text-xs font-mono font-semibold">
          {row.original._count.transaksi} penjualan
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.isActive;
        return active ? (
          <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 text-xs font-bold gap-1">
            <CheckCircle2 className="w-3 h-3" /> Aktif
          </Badge>
        ) : (
          <Badge variant="destructive" className="text-xs font-bold gap-1">
            <XCircle className="w-3 h-3" /> Nonaktif
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedUser(u);
                setNewPassword("");
                setIsPasswordOpen(true);
              }}
              className="h-8 text-xs gap-1 px-2.5"
              title="Reset / Ganti Password"
            >
              <Key className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Password</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => openEdit(u)}
              className="h-8 text-xs gap-1 px-2.5"
              title="Edit Data Pengguna"
            >
              <Pencil className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Edit</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(u)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Hapus / Nonaktifkan Pengguna"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <h2 className="text-base font-bold">Daftar Pengguna Sistem</h2>
          <p className="text-xs text-muted-foreground">
            Kelola akun kasir dan hak akses operasional toko Anda.
          </p>
        </div>

        <Button
          onClick={() => {
            setUsername("");
            setNama("");
            setPassword("");
            setRole("KASIR");
            setTelepon("");
            setIsAddOpen(true);
          }}
          className="gap-2 font-bold shadow-xs text-xs h-9 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Tambah Pengguna Baru
        </Button>
      </div>

      {/* Tabel Data Pengguna */}
      <DataTable columns={columns} data={data} />

      {/* Modal 1: Tambah Pengguna Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Tambah Pengguna Baru
            </DialogTitle>
            <DialogDescription className="text-xs">
              Buat akun kasir atau pemilik toko baru untuk operasional POS.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-3.5 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Username Login</Label>
              <Input
                placeholder="Contoh: kasir_pagi"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama Lengkap</Label>
              <Input
                placeholder="Contoh: Siti Rahmawati"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kata Sandi (Password)</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Peran (Role Akses)</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "OWNER" | "KASIR")}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
              >
                <option value="KASIR">KASIR (Hanya Transaksi, Kasbon, dan Cek Stok)</option>
                <option value="OWNER">OWNER / ADMIN (Akses Penuh Seluruh Sistem)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nomor Telepon / WA (Opsional)</Label>
              <Input
                placeholder="0812-xxxx-xxxx"
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Data Pengguna */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" /> Edit Data Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs">
              Ubah informasi akun @{selectedUser?.username}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUser} className="space-y-3.5 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nama Lengkap</Label>
              <Input
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Peran (Role Akses)</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "OWNER" | "KASIR")}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
              >
                <option value="KASIR">KASIR</option>
                <option value="OWNER">OWNER / ADMIN</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nomor Telepon</Label>
              <Input
                value={telepon}
                onChange={(e) => setTelepon(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Status Akun</Label>
              <select
                value={isActive ? "true" : "false"}
                onChange={(e) => setIsActive(e.target.value === "true")}
                className="w-full h-9 rounded-md border bg-background px-3 text-xs"
              >
                <option value="true">Aktif (Dapat Login)</option>
                <option value="false">Nonaktif (Dilarang Login)</option>
              </select>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Ganti / Reset Password */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> Ganti Kata Sandi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan kata sandi baru untuk <strong>{selectedUser?.nama}</strong> (@{selectedUser?.username}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-3.5 py-1 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kata Sandi Baru</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 text-xs font-mono"
                required
                autoFocus
              />
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordOpen(false)}
                disabled={isSubmitting}
                className="h-9 text-xs"
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-9 text-xs font-bold">
                {isSubmitting ? "Mengubah..." : "Ubah Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
