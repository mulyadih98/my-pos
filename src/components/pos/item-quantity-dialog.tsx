"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  Tag,
  CornerDownLeft,
} from "lucide-react";

export interface ProductVariant {
  id: string;
  hargaRetail: number;
  hargaMember: number;
  konversi: number;
  unit: {
    name: string;
  };
}

export interface ProductItem {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  kategoriId?: string | null;
  kategori?: {
    id: string;
    nama: string;
  } | null;
  varians: ProductVariant[];
}

interface ItemQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductItem | null;
  initialVarianIndex?: number;
  initialQty?: number;
  priceType: "retail" | "member";
  alreadyInCartPcs?: number;
  onConfirm: (product: ProductItem, varianIndex: number, qty: number) => void;
}

export function ItemQuantityDialog({
  open,
  onOpenChange,
  product,
  initialVarianIndex = 0,
  initialQty = 1,
  priceType,
  alreadyInCartPcs = 0,
  onConfirm,
}: ItemQuantityDialogProps) {
  const [selectedVarianIndex, setSelectedVarianIndex] = useState(initialVarianIndex);
  const [qty, setQty] = useState<number>(initialQty);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Sync state when product opens
  useEffect(() => {
    if (open && product) {
      setSelectedVarianIndex(
        initialVarianIndex >= 0 && initialVarianIndex < product.varians.length
          ? initialVarianIndex
          : 0
      );
      setQty(Math.max(1, initialQty || 1));

      // Auto-focus and select quantity input
      setTimeout(() => {
        if (qtyInputRef.current) {
          qtyInputRef.current.focus();
          qtyInputRef.current.select();
        }
      }, 60);
    }
  }, [open, product, initialVarianIndex, initialQty]);

  const currentVarian = useMemo(() => {
    if (!product || !product.varians || product.varians.length === 0) {
      return {
        id: "default",
        hargaRetail: 0,
        hargaMember: 0,
        konversi: 1,
        unit: { name: "Pcs" },
      };
    }
    return product.varians[selectedVarianIndex] || product.varians[0];
  }, [product, selectedVarianIndex]);

  const currentPrice = useMemo(() => {
    return priceType === "retail"
      ? currentVarian.hargaRetail
      : currentVarian.hargaMember;
  }, [priceType, currentVarian]);

  const konversi = currentVarian.konversi || 1;
  const requestedPcs = Math.max(1, qty) * konversi;
  const totalNeededPcs = alreadyInCartPcs + requestedPcs;
  const totalStock = product?.stok || 0;
  const remainingStockPcs = totalStock - alreadyInCartPcs;
  const maxAllowedInCurrentUnit = Math.max(
    0,
    Math.floor(remainingStockPcs / konversi)
  );

  const isOverStock = totalStock <= 0 || requestedPcs > remainingStockPcs;
  const subtotal = currentPrice * Math.max(0, qty);

  // Handle submit
  const handleConfirm = () => {
    if (!product || isOverStock || qty <= 0) return;
    onConfirm(product, selectedVarianIndex, qty);
    onOpenChange(false);
  };

  // Keyboard Navigation inside dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setQty((prev) => prev + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setQty((prev) => Math.max(1, prev - 1));
    } else if (e.key === "ArrowLeft" && product && product.varians.length > 1) {
      e.preventDefault();
      setSelectedVarianIndex((prev) =>
        prev > 0 ? prev - 1 : product.varians.length - 1
      );
    } else if (e.key === "ArrowRight" && product && product.varians.length > 1) {
      e.preventDefault();
      setSelectedVarianIndex((prev) =>
        prev < product.varians.length - 1 ? prev + 1 : 0
      );
    } else if (e.altKey && !isNaN(Number(e.key)) && Number(e.key) > 0) {
      // Shortcut Alt + 1..9 untuk ganti satuan
      const targetIdx = Number(e.key) - 1;
      if (product && targetIdx >= 0 && targetIdx < product.varians.length) {
        e.preventDefault();
        setSelectedVarianIndex(targetIdx);
      }
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onKeyDown={handleKeyDown}
        className="max-w-md p-0 overflow-hidden rounded-2xl gap-0 border shadow-2xl bg-card"
      >
        {/* HEADER: Informasi Produk */}
        <DialogHeader className="p-4 pb-3 border-b bg-muted/20 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 pr-6">
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug truncate">
                {product.nama}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5 font-mono">
                <span>{product.kode}</span>
                {product.kategori?.nama && (
                  <>
                    <span>&bull;</span>
                    <span className="font-sans font-medium text-foreground">
                      {product.kategori.nama}
                    </span>
                  </>
                )}
              </DialogDescription>
            </div>
          </div>

          {/* Sisa Stok Badge */}
          <div className="mt-2.5 flex items-center justify-between p-2 rounded-lg bg-background border text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-primary" /> Stok Fisik Toko:
            </span>
            <div className="flex items-center gap-1 font-mono">
              <span
                className={`font-black ${
                  remainingStockPcs <= 0
                    ? "text-destructive"
                    : remainingStockPcs <= 5
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {remainingStockPcs} pcs
              </span>
              {alreadyInCartPcs > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  (di keranjang: {alreadyInCartPcs} pcs)
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* BODY: Satuan, Kuantitas, & Kalkulasi */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 1. Pilihan Satuan / Unit (Varian) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" /> Pilihan Satuan:
              </label>
              {product.varians.length > 1 && (
                <span className="text-[10.5px] text-muted-foreground">
                  Tekan [Alt+1..{product.varians.length}] atau [←/→]
                </span>
              )}
            </div>

            {product.varians.length > 1 ? (
              <div
                className={`grid gap-2 ${
                  product.varians.length === 2
                    ? "grid-cols-2"
                    : product.varians.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {product.varians.map((v, idx) => {
                  const isSelected = idx === selectedVarianIndex;
                  const price =
                    priceType === "retail" ? v.hargaRetail : v.hargaMember;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVarianIndex(idx);
                        qtyInputRef.current?.focus();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-1 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-xs"
                          : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-foreground">
                          {v.unit.name}
                        </span>
                        <span className="text-[9.5px] font-mono font-semibold px-1 py-0.2 rounded bg-muted text-muted-foreground">
                          [{idx + 1}]
                        </span>
                      </div>
                      <div>
                        <p className="font-mono font-bold text-xs text-primary">
                          Rp {price.toLocaleString("id-ID")}
                        </p>
                        {v.konversi > 1 && (
                          <p className="text-[9.5px] text-muted-foreground mt-0.5">
                            1 {v.unit.name} = {v.konversi} pcs
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-muted/40 border flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Satuan: <strong>{currentVarian.unit.name}</strong>
                  {currentVarian.konversi > 1 &&
                    ` (Isi ${currentVarian.konversi} pcs)`}
                </span>
                <span className="font-mono font-bold text-primary">
                  Rp {currentPrice.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          {/* 2. Input Kuantitas (Qty) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Jumlah / Kuantitas ({currentVarian.unit.name}):</span>
              <span className="text-[10.5px] text-muted-foreground normal-case">
                Gunakan panah [↑ / ↓]
              </span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setQty((prev) => Math.max(1, prev - 1));
                  qtyInputRef.current?.focus();
                }}
                className="h-12 w-12 rounded-xl shrink-0 text-foreground"
                disabled={qty <= 1}
              >
                <Minus className="w-5 h-5" />
              </Button>

              <div className="relative flex-1">
                <Input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  value={qty || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQty(isNaN(val) ? 0 : val);
                  }}
                  className="h-12 text-2xl font-black font-mono text-center rounded-xl bg-background border-2 focus-visible:border-primary shadow-inner"
                  placeholder="1"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => {
                  setQty((prev) => prev + 1);
                  qtyInputRef.current?.focus();
                }}
                className="h-12 w-12 rounded-xl shrink-0 text-foreground"
                disabled={requestedPcs >= remainingStockPcs}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Quick Chips (+1, +2, +5, +10, Maksimal) */}
            <div className="flex items-center gap-1.5 pt-1">
              {[1, 2, 5, 10].map((delta) => (
                <Button
                  key={delta}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQty(delta);
                    qtyInputRef.current?.focus();
                  }}
                  className={`flex-1 h-8 text-xs font-semibold rounded-lg ${
                    qty === delta
                      ? "bg-primary text-primary-foreground border-primary"
                      : ""
                  }`}
                >
                  {delta}
                </Button>
              ))}

              {maxAllowedInCurrentUnit > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQty(maxAllowedInCurrentUnit);
                    qtyInputRef.current?.focus();
                  }}
                  className={`flex-1 h-8 text-xs font-bold rounded-lg border-primary/40 text-primary ${
                    qty === maxAllowedInCurrentUnit
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  }`}
                  title="Ambil seluruh sisa stok yang ada"
                >
                  Maks ({maxAllowedInCurrentUnit})
                </Button>
              )}
            </div>
          </div>

          {/* 3. Ringkasan Kalkulasi & Validasi */}
          <div className="p-3 bg-muted/40 rounded-xl border space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Perhitungan:</span>
              <span className="font-mono">
                {qty} {currentVarian.unit.name} &times; Rp{" "}
                {currentPrice.toLocaleString("id-ID")}
              </span>
            </div>

            {currentVarian.konversi > 1 && (
              <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                <span>Total Fisik Terambil:</span>
                <span className="font-mono font-semibold">
                  {requestedPcs} pcs ({qty} &times; {currentVarian.konversi})
                </span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-1 border-t border-border">
              <span className="font-bold text-foreground">Subtotal Item:</span>
              <span className="text-lg font-black text-primary font-mono">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Peringatan jika melebihi stok */}
          {isOverStock && (
            <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center gap-2 text-xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold leading-tight">
                Stok tidak mencukupi! Sisa stok fisik hanya {remainingStockPcs}{" "}
                pcs (Maks: {maxAllowedInCurrentUnit} {currentVarian.unit.name}).
              </span>
            </div>
          )}
        </div>

        {/* FOOTER: Tombol Aksi */}
        <div className="p-3.5 px-4 sm:px-5 border-t shrink-0 flex items-center justify-between gap-2.5 bg-muted/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 text-xs px-4"
          >
            Batal [Esc]
          </Button>

          <Button
            type="button"
            variant="default"
            disabled={isOverStock || qty <= 0}
            onClick={handleConfirm}
            className="flex-1 h-10 font-bold gap-2 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Masukkan Keranjang</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 bg-primary-foreground/20 text-primary-foreground rounded text-[10px] font-mono ml-1">
              Enter ↵
            </kbd>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
