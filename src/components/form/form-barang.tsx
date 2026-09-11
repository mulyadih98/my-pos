"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import QrScanner from "../scanner";

type VarianForm = {
  id?: string;
  hargaRetail: string;
  hargaMember: string;
  unitId: string;
  konversi: string;
};

type Props = {
  mode: "create" | "edit";
  defaultValues?: any;
  suppliers: any[];
  units: any[];
  categories: any[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
};

export function BarangForm({
  mode,
  defaultValues,
  suppliers,
  units,
  categories,
  onSubmit,
  onCancel,
}: Props) {
  const [nama, setNama] = useState(defaultValues?.nama ?? "");
  const [kode, setKode] = useState(defaultValues?.kode ?? "");
  const [hargaBeli, setHargaBeli] = useState(String(defaultValues?.hargaBeli ?? ""));
  const [stok, setStok] = useState(String(defaultValues?.stok ?? ""));
  const [kategoriId, setKategoriId] = useState(defaultValues?.kategoriId ?? "");
  const [supplierId, setSupplierId] = useState(defaultValues?.supplierId ?? "");

  const [varians, setVarians] = useState<VarianForm[]>(
    defaultValues?.varians?.map((v: any) => ({
      id: v.id,
      hargaRetail: String(v.hargaRetail),
      hargaMember: String(v.hargaMember),
      unitId: v.unitId,
      konversi: String(v.konversi),
    })) ?? [
      {
        hargaRetail: "",
        hargaMember: "",
        unitId: "",
        konversi: "1",
      },
    ],
  );

  const addRow = () => {
    setVarians((prev) => [
      ...prev,
      {
        hargaRetail: "",
        hargaMember: "",
        unitId: "",
        konversi: "1",
      },
    ]);
  };

  const updateVarian = (i: number, field: keyof VarianForm, value: string) => {
    const newData = [...varians];
    newData[i][field] = value;
    setVarians(newData);
  };

  const removeRow = (i: number) => {
    setVarians(varians.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    await onSubmit({
      nama,
      kode,
      stok: Number(stok),
      hargaBeli: Number(hargaBeli),
      kategoriId,
      supplierId,
      varians: varians.map((v) => ({
        id: v.id,
        hargaRetail: Number(v.hargaRetail),
        hargaMember: Number(v.hargaMember),
        unitId: v.unitId,
        konversi: Number(v.konversi),
      })),
    });
  };

  const isValid =
    nama &&
    supplierId &&
    varians.length > 0 &&
    varians.every((v) => v.unitId && v.hargaRetail);

  return (
    <>
      {/* BODY */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:p-6">
          {/* INFORMASI BARANG */}
          <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Informasi Barang
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama Barang</label>
                <Input value={nama} onChange={(e) => setNama(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Kode Barang</label>
                <Input value={kode} onChange={(e) => setKode(e.target.value)} />
                <QrScanner onScan={(value) => setKode(value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Stok</label>
                <Input
                  type="number"
                  value={stok}
                  onChange={(e) => setStok(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Kategori</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={kategoriId}
                  onChange={(e) => setKategoriId(e.target.value)}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((k: any) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <label className="text-sm font-bold text-primary">Harga Beli (Modal)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                  <Input
                    type="number"
                    value={hargaBeli}
                    onChange={(e) => setHargaBeli(e.target.value)}
                    className="pl-10 font-bold"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 italic">* Harga beli berlaku untuk satu barang utama</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Supplier</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* VARIAN */}
          <div className="border rounded-xl p-4 bg-muted/20">
            <div className="flex justify-between mb-3">
              <h3 className="text-sm font-semibold">Varian Barang</h3>
              <Button size="sm" onClick={addRow}>
                + Tambah
              </Button>
            </div>

            <div className="space-y-4">
              {varians.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3 border p-3 rounded-md bg-background"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Harga Retail</label>
                    <Input
                      type="number"
                      value={v.hargaRetail}
                      onChange={(e) =>
                        updateVarian(i, "hargaRetail", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Harga Member</label>
                    <Input
                      type="number"
                      value={v.hargaMember}
                      onChange={(e) =>
                        updateVarian(i, "hargaMember", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Unit</label>
                    <select
                      className="w-full border rounded-md p-2"
                      value={v.unitId}
                      onChange={(e) =>
                        updateVarian(i, "unitId", e.target.value)
                      }
                    >
                      <option value="">Pilih Unit</option>
                      {units.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Konversi</label>
                    <Input
                      type="number"
                      value={v.konversi}
                      onChange={(e) =>
                        updateVarian(i, "konversi", e.target.value)
                      }
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeRow(i)}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t px-4 py-3 flex justify-end gap-2 bg-background sticky bottom-0 z-10 shrink-0">
        <Button variant="outline" onClick={onCancel}>
          Batal
        </Button>

        <Button disabled={!isValid} onClick={handleSubmit}>
          {mode === "create" ? "Simpan" : "Update"}
        </Button>
      </div>
    </>
  );
}
