"use client";

import { useState, useRef, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
} from "lucide-react";
import {
  importBarangBatch,
  revalidateBarangPages,
  ImportBarangItem,
} from "@/app/actions/barang";
import { toast } from "sonner";

interface ParsedRow {
  rowNum: number;
  kode: string;
  isAutoBarcode: boolean;
  isDuplicateInFile?: boolean;
  duplicateRowOf?: number;
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

interface ImportProgressState {
  current: number;
  total: number;
  percentage: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  statusText: string;
}

export function ImportBarangDialog() {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [onDuplicate, setOnDuplicate] = useState<"update" | "skip">("update");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgressState | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "invalid">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef(false);

  const pageSize = 50;

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
    setImportProgress(null);
    setPreviewPage(1);
    setPreviewFilter("all");

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

        const barcodeTracker = new Map<string, number>();
        const autoBarcodeBase = Date.now().toString().slice(-6);

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
          // Generate barcode unik dengan sequence counter untuk menjamin 0% collision
          const finalKode = rawKode || `899${autoBarcodeBase}${String(idx + 1).padStart(4, "0")}`;

          let isDuplicateInFile = false;
          let duplicateRowOf: number | undefined;

          if (rawKode) {
            const lowerCode = rawKode.toLowerCase();
            if (barcodeTracker.has(lowerCode)) {
              isDuplicateInFile = true;
              duplicateRowOf = barcodeTracker.get(lowerCode);
            } else {
              barcodeTracker.set(lowerCode, idx + 2);
            }
          }

          return {
            rowNum: idx + 2, // Baris 1 adalah header di spreadsheet
            kode: finalKode,
            isAutoBarcode,
            isDuplicateInFile,
            duplicateRowOf,
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
    setImportProgress(null);
    setPreviewPage(1);
    setPreviewFilter("all");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 3. Eksekusi Import ke Server secara Bertahap (Chunking 100 items)
  const handleStartImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Tidak ada data barang yang valid untuk diimpor.");
      return;
    }

    setIsProcessing(true);
    abortControllerRef.current = false;

    const CHUNK_SIZE = 100;
    const totalItems = validRows.length;
    const totalBatches = Math.ceil(totalItems / CHUNK_SIZE);

    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const accumulatedErrors: string[] = [];

    setImportProgress({
      current: 0,
      total: totalItems,
      percentage: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      currentBatch: 1,
      totalBatches,
      statusText: `Mempersiapkan ${totalItems.toLocaleString("id-ID")} barang...`,
    });

    try {
      for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
        if (abortControllerRef.current) {
          toast.info("Proses impor dihentikan oleh pengguna.");
          break;
        }

        const chunkRows = validRows.slice(i, i + CHUNK_SIZE);
        const batchNum = Math.floor(i / CHUNK_SIZE) + 1;

        setImportProgress((prev) =>
          prev
            ? {
                ...prev,
                currentBatch: batchNum,
                statusText: `Mengimpor Batch ${batchNum} dari ${totalBatches} (${chunkRows.length} barang)...`,
              }
            : null
        );

        const itemsPayload: ImportBarangItem[] = chunkRows.map((r) => ({
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

        // Retry loop untuk mengatasi potensi gangguan koneksi sesaat
        let attempts = 0;
        let batchRes = null;
        let lastError: any = null;

        while (attempts < 3) {
          try {
            batchRes = await importBarangBatch(itemsPayload, {
              onDuplicate,
              revalidateAfter: false,
            });
            break;
          } catch (err: any) {
            attempts++;
            lastError = err;
            if (attempts < 3) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (batchRes) {
          totalCreated += batchRes.created;
          totalUpdated += batchRes.updated;
          totalSkipped += batchRes.skipped;
          if (batchRes.errors.length > 0) {
            accumulatedErrors.push(...batchRes.errors);
          }
        } else {
          totalFailed += chunkRows.length;
          accumulatedErrors.push(
            `Batch ${batchNum} gagal: ${lastError?.message || "Koneksi terputus"}`
          );
        }

        const currentProcessed = Math.min(i + chunkRows.length, totalItems);
        const percentage = Math.round((currentProcessed / totalItems) * 100);

        setImportProgress({
          current: currentProcessed,
          total: totalItems,
          percentage,
          created: totalCreated,
          updated: totalUpdated,
          skipped: totalSkipped,
          failed: totalFailed,
          currentBatch: batchNum,
          totalBatches,
          statusText: `Selesai batch ${batchNum} dari ${totalBatches}`,
        });
      }

      // Revalidasi cache halaman dashboard/barang hanya 1x di akhir proses
      try {
        await revalidateBarangPages();
      } catch {}

      let successMsg = `Impor selesai! Total ${totalCreated + totalUpdated} produk berhasil disimpan (${totalCreated} baru`;
      if (totalUpdated > 0) successMsg += `, ${totalUpdated} diperbarui`;
      if (totalSkipped > 0) successMsg += `, ${totalSkipped} dilewati`;
      if (totalFailed > 0) successMsg += `, ${totalFailed} gagal`;
      successMsg += ").";

      toast.success(successMsg);

      if (accumulatedErrors.length > 0) {
        toast.warning(`${accumulatedErrors.length} catatan/peringatan selama proses impor.`);
      }

      // Jika tidak di-abort dan tidak ada yang gagal, tutup otomatis setelah 1.5 detik
      if (!abortControllerRef.current && totalFailed === 0) {
        setTimeout(() => {
          handleReset();
          setOpen(false);
          setImportProgress(null);
        }, 1500);
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengimpor barang.");
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const filteredRows = useMemo(() => {
    if (previewFilter === "valid") return parsedRows.filter((r) => r.isValid);
    if (previewFilter === "invalid") return parsedRows.filter((r) => !r.isValid);
    return parsedRows;
  }, [parsedRows, previewFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPageSafe = Math.min(Math.max(1, previewPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPageSafe, pageSize]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 font-semibold shadow-xs">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
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
                <FileSpreadsheet className="w-5 h-5 text-primary" />
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
                className="inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 gap-1.5 border border-primary/30 text-foreground bg-background hover:bg-accent transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-primary" /> Template Excel (.xlsx)
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
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
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
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{fileName}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Total: <strong>{parsedRows.length.toLocaleString("id-ID")}</strong> baris</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {validCount.toLocaleString("id-ID")} Siap Diimpor
                      </span>
                      {invalidCount > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-destructive font-semibold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {invalidCount.toLocaleString("id-ID")} Tidak Lengkap
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

              {/* Progress Card Saat Proses Impor Berjalan */}
              {importProgress && (
                <div className="p-4 sm:p-5 border rounded-xl bg-card space-y-3.5 shadow-xs border-primary/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-foreground flex items-center gap-2">
                        {isProcessing ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                        ) : importProgress.failed > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                        <span>{importProgress.statusText}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Memproses {importProgress.current.toLocaleString("id-ID")} dari{" "}
                        {importProgress.total.toLocaleString("id-ID")} produk ({importProgress.percentage}%) &bull; Batch {importProgress.currentBatch} dari {importProgress.totalBatches}
                      </p>
                    </div>

                    {isProcessing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          abortControllerRef.current = true;
                          toast.info("Menghentikan proses impor setelah batch ini selesai...");
                        }}
                        className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold shrink-0"
                      >
                        Hentikan Impor
                      </Button>
                    )}
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress.percentage}%` }}
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                        Baru Ditambahkan
                      </p>
                      <p className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                        +{importProgress.created.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400">
                        Diperbarui
                      </p>
                      <p className="text-lg font-extrabold text-blue-800 dark:text-blue-300 font-mono">
                        {importProgress.updated.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                        Dilewati (Skip)
                      </p>
                      <p className="text-lg font-extrabold text-amber-800 dark:text-amber-300 font-mono">
                        {importProgress.skipped.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-[10px] uppercase font-bold text-destructive">
                        Gagal
                      </p>
                      <p className="text-lg font-extrabold text-destructive font-mono">
                        {importProgress.failed.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Opsi Duplikat Barcode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/20 border rounded-lg text-xs">
                <div>
                  <span className="font-semibold text-foreground block">
                    Penanganan Kode Barcode Sama / Duplikat:
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Berlaku untuk barcode yang sudah terdaftar di database maupun barcode kembar di file.
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="radio"
                      name="onDuplicate"
                      value="update"
                      disabled={isProcessing}
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
                      disabled={isProcessing}
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
                <div className="p-3 bg-muted/40 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">
                      Pratinjau Data ({parsedRows.length.toLocaleString("id-ID")} Produk)
                    </span>
                    <span className="text-[11px] text-muted-foreground hidden md:inline">
                      &bull; Tampil {pageSize} baris per halaman
                    </span>
                  </div>

                  {/* Filter Tabs: Semua / Siap / Error */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setPreviewFilter("all");
                        setPreviewPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        previewFilter === "all"
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-background text-muted-foreground hover:text-foreground border border-input"
                      }`}
                    >
                      Semua ({parsedRows.length})
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setPreviewFilter("valid");
                        setPreviewPage(1);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        previewFilter === "valid"
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : "bg-background text-muted-foreground hover:text-emerald-700 border border-input"
                      }`}
                    >
                      Siap ({validCount})
                    </button>
                    {invalidCount > 0 && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setPreviewFilter("invalid");
                          setPreviewPage(1);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          previewFilter === "invalid"
                            ? "bg-destructive text-destructive-foreground shadow-2xs"
                            : "bg-background text-muted-foreground hover:text-destructive border border-input"
                        }`}
                      >
                        Error ({invalidCount})
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-[360px]">
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
                      {paginatedRows.map((row) => (
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
                          <td className="p-2.5 font-mono whitespace-nowrap">
                            <span>{row.kode}</span>
                            {row.isAutoBarcode && (
                              <span
                                className="ml-1.5 px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[9px] rounded font-sans font-bold"
                                title="Barcode dibuat otomatis oleh sistem"
                              >
                                Auto
                              </span>
                            )}
                            {row.isDuplicateInFile && (
                              <span
                                className="ml-1.5 px-1.5 py-0.5 bg-blue-500/15 text-blue-700 dark:text-blue-400 text-[9px] rounded font-sans font-bold"
                                title={`Barcode kembar dengan baris ${row.duplicateRowOf} di file spreadsheet ini`}
                              >
                                Kembar di File
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
                          <td className="p-2.5 text-center whitespace-nowrap">
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

                {/* Kontrol Paginasi Pratinjau */}
                {filteredRows.length > pageSize && (
                  <div className="p-2.5 bg-muted/30 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="text-muted-foreground">
                      Menampilkan {((currentPageSafe - 1) * pageSize) + 1} -{" "}
                      {Math.min(currentPageSafe * pageSize, filteredRows.length)} dari{" "}
                      {filteredRows.length.toLocaleString("id-ID")} produk
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPageSafe <= 1 || isProcessing}
                        onClick={() => setPreviewPage(1)}
                        className="h-7 w-7 p-0"
                        title="Halaman Pertama"
                      >
                        <ChevronsLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPageSafe <= 1 || isProcessing}
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        className="h-7 w-7 p-0"
                        title="Halaman Sebelumnya"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="px-2 text-xs font-semibold text-foreground font-mono">
                        {currentPageSafe} / {totalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPageSafe >= totalPages || isProcessing}
                        onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                        className="h-7 w-7 p-0"
                        title="Halaman Berikutnya"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={currentPageSafe >= totalPages || isProcessing}
                        onClick={() => setPreviewPage(totalPages)}
                        className="h-7 w-7 p-0"
                        title="Halaman Terakhir"
                      >
                        <ChevronsRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 sm:px-6 py-3.5 border-t shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 z-20">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {importProgress ? (
              <span className="font-semibold text-foreground">
                Proses: {importProgress.current.toLocaleString("id-ID")} / {importProgress.total.toLocaleString("id-ID")} barang ({importProgress.percentage}%)
              </span>
            ) : parsedRows.length > 0 ? (
              <span>
                {validCount.toLocaleString("id-ID")} barang valid siap diimpor ke database toko.
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isProcessing) {
                  abortControllerRef.current = true;
                }
                setOpen(false);
              }}
              disabled={isProcessing && !abortControllerRef.current}
            >
              {importProgress && !isProcessing ? "Tutup" : "Batal"}
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={validCount === 0 || isProcessing}
              onClick={
                importProgress && !isProcessing && importProgress.failed === 0
                  ? () => {
                      handleReset();
                      setOpen(false);
                    }
                  : handleStartImport
              }
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Mengimpor ({importProgress?.percentage ?? 0}%)
                </>
              ) : importProgress && !isProcessing && importProgress.failed === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Selesai & Tutup
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mulai Impor {validCount > 0 ? `(${validCount.toLocaleString("id-ID")} Barang)` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
