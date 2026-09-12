"use client";

import { useState, useEffect } from "react";
import { updatePengaturanDefault } from "@/app/actions/pengaturan";
import { StoreSettings } from "@/types/pengaturan";
import {
  getLocalStoreSettings,
  saveLocalStoreSettings,
  clearLocalStoreSettings,
} from "@/lib/settings-client";
import {
  connectDirectPrinter,
  disconnectDirectPrinter,
  isDirectPrinterConnected,
  getConnectedPrinterName,
  isBluetoothSupported,
  testDirectPrinter,
  smartPrintReceipt,
} from "@/lib/direct-printer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Store,
  Printer,
  Save,
  RotateCcw,
  CheckCircle2,
  Bluetooth,
  Sparkles,
  Smartphone,
  Server,
  FileText,
  Type,
  ShoppingCart,
  Keyboard,
  Boxes,
  Layers,
  ArrowRight,
} from "lucide-react";

export function PengaturanClient({ defaultSettings }: { defaultSettings: StoreSettings }) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<string>("toko");
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [directConnected, setDirectConnected] = useState(false);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [isTestingPrint, setIsTestingPrint] = useState(false);
  const [isSavingDb, setIsSavingDb] = useState(false);

  // Load local settings on mount
  useEffect(() => {
    const local = getLocalStoreSettings(defaultSettings);
    setSettings(local);
    setIsClientLoaded(true);
    setDirectConnected(isDirectPrinterConnected());
    setConnectedName(getConnectedPrinterName());
  }, [defaultSettings]);

  const handleConnectDirect = async () => {
    if (directConnected) {
      await disconnectDirectPrinter();
      setDirectConnected(false);
      setConnectedName(null);
      toast.info("Printer direct diputus.");
      return;
    }

    toast.info("Membuka dialog pencarian printer Bluetooth...");
    const res = await connectDirectPrinter();
    if (res.success) {
      setDirectConnected(true);
      setConnectedName(res.name || "Printer Bluetooth");
      toast.success(`Berhasil terhubung ke ${res.name || "Printer"}!`);
    } else {
      toast.error(res.error || "Gagal menghubungkan printer.");
    }
  };

  const handleTestPrint = async () => {
    setIsTestingPrint(true);
    toast.info("Memulai tes print struk...");

    try {
      const sampleData = {
        invoice: "TEST-" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        total: 18500,
        bayar: 20000,
        kembali: 1500,
        date: new Date(),
        kasirNama: "Kasir Utama",
        member: { nama: "Pelanggan Tes", kode: "MBR-TEST" },
        items: [
          { nama: "Kopi Hitam Mantap 250g", unitName: "Pcs", qty: 1, harga: 15000 },
          { nama: "Air Mineral 600ml", unitName: "Botol", qty: 1, harga: 3500 },
        ],
      };

      const result = await smartPrintReceipt(sampleData, settings);
      if (result.success) {
        if (result.method === "direct") {
          toast.success("Tes cetak berhasil dikirim langsung ke printer (Direct ESC/POS)!");
        } else {
          toast.success("Tes cetak dibuka via driver printer Windows (Isolated Iframe)!");
        }
      } else {
        toast.error(result.error || "Gagal melakukan tes cetak.");
      }
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan saat tes cetak.");
    } finally {
      setIsTestingPrint(false);
    }
  };

  const handleSaveLocal = () => {
    saveLocalStoreSettings(settings);
    toast.success("Pengaturan untuk perangkat ini berhasil disimpan!");
  };

  const handleSaveGlobal = async () => {
    setIsSavingDb(true);
    try {
      const res = await updatePengaturanDefault(settings);
      if (res.success) {
        saveLocalStoreSettings(settings);
        toast.success("Pengaturan berhasil disimpan sebagai DEFAULT SEMUA PERANGKAT!");
      } else {
        toast.error(res.error || "Gagal menyimpan ke database.");
      }
    } catch (e: any) {
      toast.error(e.message || "Gagal menyimpan ke database.");
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleResetLocal = () => {
    clearLocalStoreSettings();
    setSettings(defaultSettings);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-ui-font-size", defaultSettings.uiFontSize || "md");
      document.documentElement.setAttribute("data-ui-font-weight", defaultSettings.uiFontWeight || "normal");
      document.documentElement.setAttribute("data-ui-font-family", defaultSettings.uiFontFamily || "sans");
    }
    toast.info("Pengaturan perangkat telah di-reset ke data default toko.");
  };

  const updateUiFont = (key: "uiFontSize" | "uiFontWeight" | "uiFontFamily", value: string) => {
    const updated = { ...settings, [key]: value as any };
    setSettings(updated);
    saveLocalStoreSettings(updated);
    if (typeof document !== "undefined") {
      if (key === "uiFontSize") document.documentElement.setAttribute("data-ui-font-size", value);
      if (key === "uiFontWeight") document.documentElement.setAttribute("data-ui-font-weight", value);
      if (key === "uiFontFamily") document.documentElement.setAttribute("data-ui-font-family", value);
    }
    toast.success("Tampilan layar kasir diperbarui!");
  };

  if (!isClientLoaded) return null;

  // Render Preview Struk Thermal (Re-usable for Toko & Printer tabs)
  const renderReceiptPreview = () => (
    <div className="space-y-3 sticky top-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
          <FileText className="w-4 h-4" /> Live Preview Struk ({settings.ukuranKertas})
        </h3>
        <Badge variant="secondary" className="font-mono text-[10px]">
          {settings.ukuranKertas === "58mm" ? "32 Kolom" : "48 Kolom"}
        </Badge>
      </div>

      {/* Kotak Struk Thermal */}
      <div
        className={`mx-auto bg-white text-black p-4 rounded-xl shadow-md border font-mono text-[11px] leading-tight select-none transition-all ${
          settings.ukuranKertas === "58mm" ? "max-w-[280px]" : "max-w-[360px]"
        }`}
        style={{ fontFamily: "'Courier New', Courier, monospace", color: "#000000" }}
      >
        <div className="text-center space-y-0.5 mb-2">
          <p className="font-black text-sm uppercase tracking-wider">{settings.namaToko}</p>
          {settings.alamat && <p className="text-[10px]">{settings.alamat}</p>}
          {settings.telepon && <p className="text-[10px]">Telp/WA: {settings.telepon}</p>}
        </div>

        <div className="text-center font-bold my-1 text-[10px]">
          {settings.ukuranKertas === "58mm" ? "--------------------------------" : "------------------------------------------------"}
        </div>

        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>No : INV-SAMPLE-001</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl: {new Date().toLocaleDateString("id-ID")}, {new Date().toLocaleTimeString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir: Kasir Toko</span>
          </div>
        </div>

        <div className="text-center font-bold my-1 text-[10px]">
          {settings.ukuranKertas === "58mm" ? "--------------------------------" : "------------------------------------------------"}
        </div>

        {/* Dummy Items dengan Simulasi Jarak Baris Langsung */}
        <div
          className={`text-[11px] ${
            settings.itemLineSpacing === "loose"
              ? "space-y-2.5 divide-y divide-dashed divide-black/40"
              : (settings.itemLineSpacing || "normal") === "normal"
              ? "space-y-2.5"
              : "space-y-1"
          }`}
        >
          <div className={settings.itemLineSpacing === "loose" ? "pt-1" : ""}>
            <div className="flex justify-between font-bold">
              <span>Indomie Goreng 85g</span>
              <span>Rp 7.000</span>
            </div>
            <div className="text-[9.5px] mt-0.5">2 Pcs x Rp 3.500</div>
          </div>

          <div className={settings.itemLineSpacing === "loose" ? "pt-2" : ""}>
            <div className="flex justify-between font-bold">
              <span>Aqua Botol 600ml</span>
              <span>Rp 3.500</span>
            </div>
            <div className="text-[9.5px] mt-0.5">1 Botol x Rp 3.500</div>
          </div>
        </div>

        <div className="text-center font-bold my-1 text-[10px]">
          {settings.ukuranKertas === "58mm" ? "--------------------------------" : "------------------------------------------------"}
        </div>

        {/* Totals */}
        <div className="space-y-0.5 font-bold">
          <div className="flex justify-between text-xs font-black">
            <span>TOTAL</span>
            <span>Rp 10.500</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>TUNAI</span>
            <span>Rp 20.000</span>
          </div>
          <div className="flex justify-between text-xs font-black">
            <span>KEMBALI</span>
            <span>Rp 9.500</span>
          </div>
        </div>

        <div className="text-center font-bold my-1 text-[10px]">
          {settings.ukuranKertas === "58mm" ? "--------------------------------" : "------------------------------------------------"}
        </div>

        <div className="text-center text-[9.5px] mt-2 whitespace-pre-line leading-relaxed">
          {settings.footerPesan || "Terima Kasih Atas Kunjungan Anda"}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-6">
      {/* TABS CONTAINER */}
      <Tabs defaultValue="toko" value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Navigation Tabs Header */}
        <div className="w-full p-1 bg-muted/60 rounded-2xl border shadow-xs">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1.5 bg-transparent p-0">
            <TabsTrigger
              value="toko"
              className="h-10 sm:h-11 px-3 text-xs font-bold rounded-xl gap-2 border border-transparent data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-xs transition-all"
            >
              <Store className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate">Identitas Toko</span>
            </TabsTrigger>

            <TabsTrigger
              value="printer"
              className="h-10 sm:h-11 px-3 text-xs font-bold rounded-xl gap-2 border border-transparent data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-xs transition-all"
            >
              <Printer className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate">Printer & Struk</span>
            </TabsTrigger>

            <TabsTrigger
              value="kasir"
              className="h-10 sm:h-11 px-3 text-xs font-bold rounded-xl gap-2 border border-transparent data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-xs transition-all"
            >
              <ShoppingCart className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate">Alur Kasir (POS)</span>
            </TabsTrigger>

            <TabsTrigger
              value="tampilan"
              className="h-10 sm:h-11 px-3 text-xs font-bold rounded-xl gap-2 border border-transparent data-active:border-border/60 data-active:bg-background data-active:text-foreground data-active:shadow-xs transition-all"
            >
              <Type className="w-4 h-4 shrink-0 text-primary" />
              <span className="truncate">Tampilan Layar</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: IDENTITAS TOKO */}
        <TabsContent value="toko" className="mt-0 outline-none animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-xs border rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Store className="w-5 h-5 text-primary" /> Identitas Toko di Struk
                  </CardTitle>
                  <CardDescription>
                    Informasi ini akan tercetak pada bagian atas dan bawah struk belanja kasir.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="namaToko">Nama Toko / Usaha</Label>
                    <Input
                      id="namaToko"
                      value={settings.namaToko}
                      onChange={(e) => setSettings({ ...settings, namaToko: e.target.value })}
                      placeholder="Contoh: TOKO BERKAH JAYA"
                      className="font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="alamat">Alamat Toko</Label>
                    <Input
                      id="alamat"
                      value={settings.alamat}
                      onChange={(e) => setSettings({ ...settings, alamat: e.target.value })}
                      placeholder="Contoh: Jl. Sudirman No. 45, Jakarta"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telepon">No. Telepon / WhatsApp</Label>
                    <Input
                      id="telepon"
                      value={settings.telepon}
                      onChange={(e) => setSettings({ ...settings, telepon: e.target.value })}
                      placeholder="Contoh: 0812-3456-7890"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="footerPesan">Catatan Footer Struk</Label>
                    <textarea
                      id="footerPesan"
                      rows={3}
                      value={settings.footerPesan}
                      onChange={(e) => setSettings({ ...settings, footerPesan: e.target.value })}
                      placeholder="Pesan ucapan terima kasih atau ketentuan pengembalian barang..."
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              {renderReceiptPreview()}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: PRINTER & STRUK */}
        <TabsContent value="printer" className="mt-0 outline-none animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-xs border rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Printer className="w-5 h-5 text-primary" /> Format Kertas & Printer Thermal
                  </CardTitle>
                  <CardDescription>
                    Sesuaikan ukuran kertas, jarak baris belanja, dan uji koneksi printer Anda.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {/* Ukuran Kertas Thermal */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-sm">Ukuran Kertas Thermal</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, ukuranKertas: "58mm" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.ukuranKertas === "58mm"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-2 text-sm">
                          <span>58mm (Mini POS)</span>
                          {settings.ukuranKertas === "58mm" && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cocok untuk printer Bluetooth portable & mini USB kasir.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, ukuranKertas: "80mm" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.ukuranKertas === "80mm"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-2 text-sm">
                          <span>80mm (Standar POS)</span>
                          {settings.ukuranKertas === "80mm" && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cocok untuk printer kasir supermarket / Epson / Xprinter.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Jarak Baris Antar Item Struk */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-sm">Jarak Baris Item Belanja pada Struk</Label>
                      <span className="text-xs text-muted-foreground font-mono">Line Spacing</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, itemLineSpacing: "compact" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.itemLineSpacing === "compact"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <span>Rapat (Hemat)</span>
                          {settings.itemLineSpacing === "compact" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Jarak padat, paling hemat kertas struk.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, itemLineSpacing: "normal" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          (settings.itemLineSpacing || "normal") === "normal"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <span>Sedang (Rekomendasi)</span>
                          {(settings.itemLineSpacing || "normal") === "normal" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Lebih renggang & nyaman dibaca kasir/pembeli.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, itemLineSpacing: "loose" })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.itemLineSpacing === "loose"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <span>Lega (Jauh / Garis)</span>
                          {settings.itemLineSpacing === "loose" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Jarak jauh dengan garis pemisah jelas.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Status & Cek Printer */}
                  <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase text-muted-foreground block">
                          Mode Penggunaan Printer:
                        </span>
                        <p className="text-sm font-bold flex items-center gap-1.5 mt-0.5">
                          {directConnected ? (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Prioritas 1 Aktif: {connectedName}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              <span className="text-blue-600 dark:text-blue-400">
                                Prioritas 2 Aktif: Driver Printer Windows (Kabel USB)
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <Badge variant={directConnected ? "default" : "outline"} className="text-xs">
                        {directConnected ? "Direct Terhubung" : "Fallback Driver"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {isBluetoothSupported() && (
                        <Button
                          type="button"
                          variant={directConnected ? "destructive" : "outline"}
                          size="sm"
                          onClick={handleConnectDirect}
                          className="gap-1.5 font-semibold"
                        >
                          <Bluetooth className="w-4 h-4" />
                          {directConnected ? "Putus Printer Direct" : "Cek / Hubungkan Bluetooth"}
                        </Button>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isTestingPrint}
                        onClick={handleTestPrint}
                        className="gap-1.5 font-bold"
                      >
                        <Printer className="w-4 h-4" />
                        {isTestingPrint ? "Mencetak..." : "Tes Print Struk"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      💡 <strong>Sistem Otomatis:</strong> Tombol kasir selalu memprioritaskan Direct Printer.
                      Bila printer direct tidak tersambung, sistem otomatis beralih mencetak lewat driver Windows (kabel USB) secara bersih tanpa URL browser.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-5">
              {renderReceiptPreview()}
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: ALUR KASIR (POS) */}
        <TabsContent value="kasir" className="mt-0 outline-none animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-xs border rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" /> Alur Input Barang Kasir
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      Khusus Perangkat Ini
                    </Badge>
                  </div>
                  <CardDescription>
                    Tentukan bagaimana sistem kasir merespons saat Anda scan barcode atau memilih barang dari pencarian.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div className="space-y-2.5">
                    <Label className="font-semibold text-sm">Dialog Konfirmasi Kuantitas & Satuan Barang</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, confirmItemQtyDialog: true })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.confirmItemQtyDialog !== false
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <span>Tampilkan Modal (Rekomendasi)</span>
                          {settings.confirmItemQtyDialog !== false && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                          Menampilkan pop-up dialog untuk memilih satuan (Pcs/Dus) dan input jumlah barang sebelum masuk keranjang.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, confirmItemQtyDialog: false })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.confirmItemQtyDialog === false
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5 text-xs">
                          <span>Langsung Masuk (1 pcs)</span>
                          {settings.confirmItemQtyDialog === false && (
                            <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                          Langsung menambahkan 1 pcs ke keranjang belanja seketika tanpa menampilkan modal dialog.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Panduan Alur Kasir Cepat */}
                  <div className="p-3.5 rounded-xl bg-muted/30 border space-y-2 text-xs">
                    <p className="font-bold text-foreground flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4 text-primary" /> Tips Melayani Transaksi Cepat Kasir:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Ketik <strong>10*nama_barang</strong> atau <strong>10*barcode</strong> untuk langsung mengisi kuantitas 10.</li>
                      <li>Tekan <strong>[F2]</strong> kapan saja untuk kembali fokus ke kolom pencarian atau barcode scanner.</li>
                      <li>Gunakan <strong>[Alt + 1..5]</strong> untuk beralih metode bayar Tunai, QRIS, Transfer, Debit, dan Kasbon.</li>
                      <li>Tekan <strong>[F8]</strong> untuk otomatis mengisi pembayaran uang pas (exact cash).</li>
                      <li>Tekan <strong>[F10]</strong> untuk langsung mengeksekusi proses pembayaran.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sisi Kanan: Kartu Pratinjau Alur Kasir */}
            <div className="lg:col-span-5 space-y-3 sticky top-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                  <ShoppingCart className="w-4 h-4" /> Simulasi Alur Kasir
                </h3>
                <Badge variant={settings.confirmItemQtyDialog !== false ? "default" : "secondary"} className="text-[10px]">
                  {settings.confirmItemQtyDialog !== false ? "Modal Aktif" : "Direct Mode"}
                </Badge>
              </div>

              <Card className="border rounded-2xl shadow-sm bg-card p-4 space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-foreground">Alur yang sedang dipilih:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {settings.confirmItemQtyDialog !== false
                      ? "Setiap scan/ketik barcode, pop-up dialog kuantitas akan muncul otomatis. Kasir cukup ketik angka dan tekan Enter untuk memasukkan barang."
                      : "Scan barcode akan langsung memasukkan 1 pcs ke keranjang tanpa ada dialog yang muncul."}
                  </p>
                </div>

                {/* Mini Preview Dialog / Mockup */}
                <div className="p-3 bg-muted/40 rounded-xl border space-y-2">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-border/80">
                    <span className="font-bold text-foreground">Indomie Mi Goreng Spesial 85g</span>
                    <Badge variant="outline" className="text-[9.5px]">8992388111223</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="p-2 rounded-lg bg-background border font-bold text-primary flex items-center justify-between">
                      <span>[1] Pcs</span>
                      <span>Rp 3.500</span>
                    </div>
                    <div className="p-2 rounded-lg bg-background border text-muted-foreground flex items-center justify-between">
                      <span>[2] Dus (40)</span>
                      <span>Rp 135.000</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-background p-2 rounded-lg border text-xs">
                    <span className="text-muted-foreground">Kuantitas:</span>
                    <span className="font-black font-mono text-base text-foreground">5 Pcs</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 text-xs">
                    <span className="font-semibold text-muted-foreground">Subtotal:</span>
                    <span className="font-mono font-bold text-sm text-primary">Rp 17.500</span>
                  </div>
                </div>

                <div className="text-[11px] text-muted-foreground bg-primary/5 border border-primary/20 p-2.5 rounded-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span>Tekan <strong>[Enter]</strong> di modal untuk langsung memasukkan barang ke keranjang belanja.</span>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: TAMPILAN LAYAR (UI) */}
        <TabsContent value="tampilan" className="mt-0 outline-none animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <Card className="shadow-xs border rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Type className="w-5 h-5 text-primary" /> Tipografi & Tampilan Layar Kasir (UI)
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      Khusus Perangkat Ini
                    </Badge>
                  </div>
                  <CardDescription>
                    Sesuaikan ukuran teks, ketebalan, dan jenis huruf agar layar kasir nyaman dibaca dari jarak meja kasir/tablet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  {/* 1. Ukuran Font Layar */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ukuran Teks Antarmuka
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "sm", label: "Kecil", size: "14px", desc: "Ringkas (Laptop)" },
                        { id: "md", label: "Standar", size: "16px", desc: "Bawaan sistem" },
                        { id: "lg", label: "Besar", size: "18.5px", desc: "Ideal Tablet / Kasir" },
                        { id: "xl", label: "Ekstra Besar", size: "21px", desc: "Teks Ekstra Jelas" },
                      ].map((item) => {
                        const isSelected = (settings.uiFontSize || "md") === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateUiFont("uiFontSize", item.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{item.label}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Ketebalan Huruf */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ketebalan Teks (Font Weight)
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "normal", label: "Normal (Regular)", desc: "Tampilan tipis bersih" },
                        { id: "medium", label: "Sedang (Medium)", desc: "Keseimbangan ideal" },
                        { id: "bold", label: "Tebal (Semibold/Bold)", desc: "Kontras tinggi tajam" },
                      ].map((item) => {
                        const isSelected = (settings.uiFontWeight || "normal") === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateUiFont("uiFontWeight", item.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{item.label}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Jenis Huruf */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Gaya Tipografi (Font Family)
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "sans", label: "Modern Sans", desc: "Geist / Inter (Default)" },
                        { id: "system", label: "Sistem OS", desc: "Segoe UI / Roboto" },
                        { id: "mono", label: "Monospace", desc: "Tampilan POS Digital" },
                        { id: "rounded", label: "Clean Rounded", desc: "Tepi membulat ramah" },
                      ].map((item) => {
                        const isSelected = (settings.uiFontFamily || "sans") === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateUiFont("uiFontFamily", item.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                                : "border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs">{item.label}</span>
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sisi Kanan: Live Interactive UI Simulation Box */}
            <div className="lg:col-span-5 space-y-3 sticky top-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                  <Type className="w-4 h-4" /> Simulasi Tampilan Layar
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {settings.uiFontSize || "md"} &bull; {settings.uiFontWeight || "normal"}
                </Badge>
              </div>

              <div className="p-4 rounded-2xl bg-card border shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-xs font-bold text-muted-foreground">Pratinjau Produk Kasir:</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Terapkan Langsung (Live)
                  </span>
                </div>

                <div className="p-3 bg-background rounded-xl border shadow-xs flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">Indomie Mi Goreng Spesial 85g</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kode: <span className="font-mono">8992388111223</span> &bull; Stok: 120 pcs
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">1 Dus</Badge>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="font-black text-primary text-base font-mono">
                      Rp 135.000
                    </span>
                    <Button size="sm" className="h-8 font-bold gap-1 text-xs">
                      + Tambah
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                  💡 Pengaturan tipografi ini langsung disesuaikan pada elemen browser lokal perangkat Anda tanpa mengubah pengaturan server kasir lain.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* GLOBAL ACTIONS FOOTER (Selalu Terlihat di Bawah Tab) */}
      <div className="pt-2 border-t">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            onClick={handleSaveLocal}
            className="w-full sm:flex-1 h-11 gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
            variant="default"
          >
            <Smartphone className="w-4 h-4" /> Simpan di Perangkat Ini
          </Button>

          <Button
            type="button"
            onClick={handleSaveGlobal}
            disabled={isSavingDb}
            className="w-full sm:flex-1 h-11 gap-2 font-bold shadow-xs cursor-pointer"
            variant="outline"
          >
            <Server className="w-4 h-4" />
            {isSavingDb ? "Menyimpan..." : "Jadikan Default Semua Perangkat"}
          </Button>

          <Button
            type="button"
            onClick={handleResetLocal}
            variant="ghost"
            className="w-full sm:w-auto h-11 text-muted-foreground hover:text-destructive gap-1.5"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
