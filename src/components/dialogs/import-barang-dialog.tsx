"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Info,
} from "lucide-react";
import { importBarangBatch, ImportBarangItem } from "@/app/actions/barang";
import { toast } from "sonner";

interface ParsedRow {
  rowNum: number;
  kode: string;
  isAutoBarcode: boolean;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  hargaBeli: number;
  hargaRetail: number;
  hargaMember: number;
  supplier: string;
  isValid: boolean;
  validationError?: string;
}

export function ImportBarangDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [onDuplicate, setOnDuplicate] = useState<"update" | "skip">("update");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fungsi Download Template
  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    const templateData = [
      {
        "Kode Barcode": "8992388111223",
        "Nama Barang": "Indomie Mi Goreng Spesial 85g",
        "Kategori": "Makanan & Minuman",
        "Satuan": "Pcs",
        "Stok Awal": 50,
        "Harga Modal": 2800,
        "Harga Jual Retail": 3500,
        "Harga Jual Member": 3200,
        "Supplier": "PT Sumber Berkah Retail",
      },
      {
        "Kode Barcode": "8991234567890",
        "Nama Barang": "Teh Pucuk Harum 350ml",
        "Kategori": "Makanan & Minuman",
        "Satuan": "Botol",
        "Stok Awal": 24,
        "Harga Modal": 2500,
        "Harga Jual Retail": 3500,
        "Harga Jual Member": 3300,
        "Supplier": "",
      },
      {
        "Kode Barcode": "",
        "Nama Barang": "Gula Pasir Kristal Putih 1kg",
        "Kategori": "Sembako",
        "Satuan": "Kg",
        "Stok Awal": 20,
        "Harga Modal": 15000,
        "Harga Jual Retail": 17500,
        "Harga Jual Member": 17000,
        "Supplier": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    // Lebar kolom otomatis agar rapi saat dibuka
    ws["!cols"] = [
      { wch: 18 }, // Kode Barcode
      { wch: 32 }, // Nama Barang
      { wch: 20 }, // Kategori
      { wch: 10 }, // Satuan
      { wch: 12 }, // Stok Awal
      { wch: 14 }, // Harga Modal
      { wch: 18 }, // Harga Jual Retail
      { wch: 18 }, // Harga Jual Member
      { wch: 25 }, // Supplier
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Barang");

    if (format === "xlsx") {
      XLSX.writeFile(wb, "template_import_barang.xlsx");
      toast.success("Template Excel (.xlsx) berhasil diunduh.");
    } else {
      XLSX.writeFile(wb, "template_import_barang.csv", { bookType: "csv" });
      toast.success("Template CSV (.csv) berhasil diunduh.");
    }
  };

  // Helper pencocokan nama kolom yang fleksibel (case-insensitive & alias)
  const getFieldValue = (row: Record<string, any>, aliases: string[]): any => {
    const keys = Object.keys(row);
    for (const alias of aliases) {
      const foundKey = keys.find(
        (k) => k.trim().toLowerCase() === alias.trim().toLowerCase()
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        return row[foundKey];
      }
    }
    return "";
  };

  // 2. Fungsi Pembacaan File Excel / CSV
  const processFile = (file: File) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      toast.error("Format file tidak didukung. Harap unggah file .xlsx, .xls, atau .csv.");
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          toast.error("File spreadsheet kosong.");
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
        });

        if (rawJson.length === 0) {
          toast.error("Tidak ada baris data yang ditemukan dalam file.");
          return;
        }

        const parsed: ParsedRow[] = rawJson.map((row, idx) => {
          const rawKode = String(
            getFieldValue(row, [
              "Kode Barcode",
              "Kode",
              "Barcode",
              "SKU",
              "Item Code",
            ])
          ).trim();

          const rawNama = String(
            getFieldValue(row, [
              "Nama Barang",
              "Nama",
              "Produk",
              "Item Name",
              "Product Name",
            ])
          ).trim();

          const rawKategori = String(
            getFieldValue(row, ["Kategori", "Category", "Jenis"])
          ).trim();

          const rawSatuan = String(
            getFieldValue(row, ["Satuan", "Unit", "UOM"])
          ).trim() || "Pcs";

          const rawStok = Math.max(
            0,
            Math.round(
              Number(
                getFieldValue(row, ["Stok Awal", "Stok", "Stock", "Qty", "Jumlah"])
              ) || 0
            )
          );

          const rawHargaBeli = Math.max(
            0,
            Math.round(
              Number(
                getFieldValue(row, [
                  "Harga Modal",
                  "Harga Beli",
                  "Modal",
                  "HPP",
                  "Cost",
                ])
              ) || 0
            )
          );

          const rawHargaRetail = Math.max(
            0,
            Math.round(
              Number(
                getFieldValue(row, [
                  "Harga Jual Retail",
                  "Harga Retail",
                  "Harga Jual",
                  "Retail Price",
                  "Price",
                ])
              ) || 0
            )
          );

          const rawHargaMemberVal = getFieldValue(row, [
            "Harga Jual Member",
            "Harga Member",
            "Member Price",
          ]);
          const rawHargaMember =
            rawHargaMemberVal !== "" && !isNaN(Number(rawHargaMemberVal)) && Number(rawHargaMemberVal) > 0
              ? Math.round(Number(rawHargaMemberVal))
              : rawHargaRetail;

          const rawSupplier = String(
            getFieldValue(row, ["Supplier", "Pemasok", "Vendor"])
          ).trim();

          // Validasi baris
          let isValid = true;
          let validationError = "";

          if (!rawNama) {
            isValid = false;
            validationError = "Nama barang kosong";
          } else if (rawHargaRetail <= 0) {
            isValid = false;
            validationError = "Harga retail harus > 0";
          }

          const isAutoBarcode = !rawKode;
          const finalKode = rawKode || `899${Math.floor(10000000 + Math.random() * 90000000)}`;

          return {
            rowNum: idx + 2, // Baris 1 adalah header di spreadsheet
            kode: finalKode,
            isAutoBarcode,
            nama: rawNama,
            kategori: rawKategori,
            satuan: rawSatuan,
            stok: rawStok,
            hargaBeli: rawHargaBeli,
            hargaRetail: rawHargaRetail,
            hargaMember: rawHargaMember,
            supplier: rawSupplier,
            isValid,
            validationError,
          };
        });

        setParsedRows(parsed);
        const validCount = parsed.filter((r) => r.isValid).length;
        toast.success(`Berhasil membaca ${parsed.length} baris (${validCount} siap diimpor).`);
      } catch (err: any) {
        toast.error(`Gagal membaca file: ${err.message || "Pastikan format file benar."}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleReset = () => {
    setFileName(null);
    setParsedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Eksekusi Import ke Server
  const handleStartImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Tidak ada data barang yang valid untuk diimpor.");
      return;
    }

    setIsProcessing(true);
    try {
      const itemsPayload: ImportBarangItem[] = validRows.map((r) => ({
        kode: r.kode,
        nama: r.nama,
        kategori: r.kategori || undefined,
        satuan: r.satuan || undefined,
        stok: r.stok,
        hargaBeli: r.hargaBeli,
        hargaRetail: r.hargaRetail,
        hargaMember: r.hargaMember,
        supplier: r.supplier || undefined,
      }));

      const res = await importBarangBatch(itemsPayload, { onDuplicate });

      let msg = `Sukses mengimpor ${res.total} barang (${res.created} baru`;
      if (res.updated > 0) msg += `, ${res.updated} diperbarui`;
      if (res.skipped > 0) msg += `, ${res.skipped} dilewati`;
      msg += ").";

      toast.success(msg);

      if (res.errors.length > 0) {
        toast.warning(`${res.errors.length} baris memiliki catatan peringatan.`);
      }

      handleReset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengimpor barang.");
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold shadow-xs">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Import Excel/CSV</span>
          <span className="sm:hidden">Import</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="!max-w-none w-[96vw] lg:w-[85vw] max-h-[90vh] h-[90vh] flex flex-col p-0 overflow-hidden box-border">
        {/* HEADER */}
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-3.5 border-b shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Import Barang Masal via Spreadsheet
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Unggah file Excel (.xlsx / .xls) atau CSV untuk menambahkan banyak produk sekaligus ke sistem kasir.
              </DialogDescription>
            </div>

            {/* Tombol Unduh Template */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="/template_import_barang.xlsx"
                download="template_import_barang.xlsx"
                className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 gap-1.5 border border-emerald-600/40 text-emerald-700 dark:text-emerald-400 bg-background hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Template Excel (.xlsx)
              </a>
              <a
                href="/template_import_barang.csv"
                download="template_import_barang.csv"
                className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 gap-1.5 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" /> Template CSV
              </a>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Petunjuk Ringkas */}
          <div className="p-3 bg-muted/30 border rounded-lg text-xs space-y-1 text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="w-4 h-4 text-primary" /> Panduan Kolom Spreadsheet:
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>
                <strong>Nama Barang</strong> dan <strong>Harga Jual Retail</strong> wajib diisi.
              </li>
              <li>
                <strong>Kode Barcode:</strong> Boleh kosong (sistem otomatis membuatkan kode barcode unik acak).
              </li>
              <li>
                <strong>Supplier:</strong> Boleh kosong (produk akan disimpan tanpa supplier terkait).
              </li>
              <li>
                <strong>Kategori & Satuan:</strong> Jika diisi nama baru, sistem otomatis mendaftarkannya ke database.
              </li>
            </ul>
          </div>

          {/* Area Upload File */}
          {!fileName ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-bold text-foreground">
                    Pilih atau Tarik File Spreadsheet ke Sini
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                  </p>
                </div>
                <Button variant="outline" size="sm" type="button" className="mt-1 font-semibold">
                  Pilih Berkas dari Komputer
                </Button>
              </div>
            </div>
          ) : (
            /* Bar Informasi File yang Terpilih & Pengaturan Duplikat */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border rounded-xl bg-card shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{fileName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Total: <strong>{parsedRows.length}</strong> baris</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} Siap
                      </span>
                      {invalidCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {invalidCount} Tidak Lengkap
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
                    disabled={isProcessing}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Ganti File
                  </Button>
                </div>
              </div>

              {/* Opsi Duplikat Barcode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/20 border rounded-lg text-xs">
                <span className="font-semibold text-foreground">
                  Jika Kode Barcode sudah ada di Database:
                </span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="onDuplicate"
                      value="update"
                      checked={onDuplicate === "update"}
                      onChange={() => setOnDuplicate("update")}
                      className="accent-primary"
                    />
                    <span>Perbarui Data (Update Stok/Harga)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="onDuplicate"
                      value="skip"
                      checked={onDuplicate === "skip"}
                      onChange={() => setOnDuplicate("skip")}
                      className="accent-primary"
                    />
                    <span>Lewati (Skip)</span>
                  </label>
                </div>
              </div>

              {/* Tabel Pratinjau Data */}
              <div className="border rounded-xl overflow-hidden shadow-2xs">
                <div className="p-3 bg-muted/40 border-b flex items-center justify-between">
                  <span className="font-bold text-xs">Pratinjau Data ({parsedRows.length} Produk)</span>
                  <span className="text-[11px] text-muted-foreground">
                    Periksa kembali data sebelum menekan tombol simpan
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/80 text-muted-foreground sticky top-0 z-10 font-semibold border-b">
                      <tr>
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5">Barcode</th>
                        <th className="p-2.5">Nama Barang</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Satuan</th>
                        <th className="p-2.5 text-right">Stok</th>
                        <th className="p-2.5 text-right">Modal</th>
                        <th className="p-2.5 text-right">Retail</th>
                        <th className="p-2.5 text-right">Member</th>
                        <th className="p-2.5">Supplier</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {parsedRows.map((row) => (
                        <tr
                          key={row.rowNum}
                          className={
                            !row.isValid
                              ? "bg-destructive/10 text-destructive-foreground"
                              : "hover:bg-muted/30"
                          }
                        >
                          <td className="p-2.5 text-center text-muted-foreground font-mono">
                            {row.rowNum - 1}
                          </td>
                          <td className="p-2.5 font-mono">
                            <span>{row.kode}</span>
                            {row.isAutoBarcode && (
                              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[9px] rounded font-sans font-bold">
                                Auto
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-semibold text-foreground max-w-[200px] truncate" title={row.nama}>
                            {row.nama || <span className="italic text-destructive">Wajib Diisi</span>}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {row.kategori || "-"}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {row.satuan}
                          </td>
                          <td className="p-2.5 text-right font-mono font-medium">
                            {row.stok}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            Rp {row.hargaBeli.toLocaleString("id-ID")}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-foreground">
                            {row.hargaRetail > 0 ? (
                              `Rp ${row.hargaRetail.toLocaleString("id-ID")}`
                            ) : (
                              <span className="text-destructive italic">0 (Wajib)</span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono text-muted-foreground">
                            Rp {row.hargaMember.toLocaleString("id-ID")}
                          </td>
                          <td className="p-2.5 text-muted-foreground">
                            {row.supplier || <span className="text-muted-foreground/60">-</span>}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Siap
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive"
                                title={row.validationError}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" /> {row.validationError}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 z-20">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {parsedRows.length > 0 && (
              <span>
                {validCount} barang valid siap diimpor ke database toko.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={validCount === 0 || isProcessing}
              onClick={handleStartImport}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Impor {validCount > 0 ? `${validCount} Barang` : "Data"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
