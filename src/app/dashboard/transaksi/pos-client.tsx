"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  User,
  CreditCard,
  UserCheck,
  XCircle,
  Gift,
  Sparkles,
  Keyboard,
  Coins,
  Settings,
  ArrowRight,
  ChevronLeft,
  ScanBarcode,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { createTransaksi } from "@/app/actions/transaksi";
import { toast } from "sonner";
import { playScanBeep, playSuccessChime, playErrorSound } from "@/lib/sound";
import { ReceiptModal, ReceiptData } from "@/components/receipt-modal";
import { KeyboardGuideDialog } from "@/components/keyboard-guide-dialog";
import { CameraScannerDialog } from "@/components/pos/camera-scanner-dialog";
import { generateId } from "@/lib/utils";

interface Varian {
  id: string;
  hargaRetail: number;
  hargaMember: number;
  konversi: number;
  unit: {
    name: string;
  };
}

interface Product {
  id: string;
  nama: string;
  kode: string;
  stok: number;
  kategoriId?: string | null;
  kategori?: {
    id: string;
    nama: string;
  } | null;
  varians: Varian[];
}

interface PromoRule {
  id: string;
  nama: string;
  barangSyaratId: string;
  minBeliQty: number;
  barangHadiahId: string;
  hadiahQty: number;
  isActive: boolean;
}

interface Member {
  id: string;
  nama: string;
  kode: string;
  telepon: string | null;
}

interface CartItem {
  id: string;
  barangId: string;
  nama: string;
  kode: string;
  varianId: string;
  unitName: string;
  harga: number;
  qty: number;
  konversi: number;
  maxStok: number;
  isBonus?: boolean;
  promoId?: string;
  bonusLabel?: string;
  parentCartItemId?: string;
}

export function POSClient({
  initialProducts,
  initialMembers,
  initialPromos = [],
}: {
  initialProducts: Product[];
  initialMembers: Member[];
  initialPromos?: PromoRule[];
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [memberSearch, setMemberSearch] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [priceType, setPriceType] = useState<"retail" | "member">("retail");
  const [bayar, setBayar] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Dialog States
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // DOM Refs for Keyboard-First navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);
  const bayarInputRef = useRef<HTMLInputElement>(null);
  const lastQtyInputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Auto-focus barcode input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Auto-scroll selected item into view when navigating with Arrow Up / Down
  useEffect(() => {
    if (dropdownListRef.current) {
      const activeEl = dropdownListRef.current.querySelector<HTMLElement>(
        `[data-item-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  // Update harga saat priceType berubah (Member vs Retail)
  useEffect(() => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.isBonus) return item;

        const product = initialProducts.find((p) => p.id === item.barangId);
        const varian = product?.varians.find((v) => v.id === item.varianId);
        if (varian) {
          return {
            ...item,
            harga: priceType === "retail" ? varian.hargaRetail : varian.hargaMember,
          };
        }
        return item;
      })
    );
  }, [priceType, initialProducts]);

  // Parse multiplier from search (misal "10*kopi" atau "5*899...")
  const parsedSearch = useMemo(() => {
    const raw = search.trim();
    const match = raw.match(/^(\d+)[\*xX]\s*(.*)$/);
    if (match) {
      return {
        multiplier: Math.max(1, parseInt(match[1], 10)),
        query: match[2].trim(),
      };
    }
    return {
      multiplier: 1,
      query: raw,
    };
  }, [search]);

  // Filter member pencarian
  const filteredMembers = useMemo(() => {
    if (!memberSearch) return [];
    return initialMembers
      .filter(
        (m) =>
          m.nama.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.kode.toLowerCase().includes(memberSearch.toLowerCase()) ||
          (m.telepon && m.telepon.includes(memberSearch))
      )
      .slice(0, 5);
  }, [memberSearch, initialMembers]);

  // Filter produk pencarian (Search text)
  const filteredProducts = useMemo(() => {
    const q = parsedSearch.query.toLowerCase();
    if (!q) {
      return [];
    }

    return initialProducts
      .filter((p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q))
      .slice(0, 30);
  }, [parsedSearch.query, initialProducts]);

  // Reset selectedIndex when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredProducts]);

  // Helper untuk mendapatkan promo aktif barang tertentu
  const getActivePromoForProduct = (productId: string) => {
    return initialPromos.find((p) => p.barangSyaratId === productId && p.isActive);
  };

  // Otomasi Promo Engine: sinkronisasi bonus saat item utama ditambah/diubah
  const applyPromoRules = (currentCart: CartItem[]): CartItem[] => {
    let updatedCart = [...currentCart];
    const mainItems = updatedCart.filter((item) => !item.isBonus);
    const requiredBonuses: CartItem[] = [];

    for (const mainItem of mainItems) {
      const promo = getActivePromoForProduct(mainItem.barangId);
      if (promo) {
        const bonusSets = Math.floor(mainItem.qty / promo.minBeliQty);
        const bonusQty = bonusSets * promo.hadiahQty;

        if (bonusQty > 0) {
          const hadiahProduct = initialProducts.find((p) => p.id === promo.barangHadiahId);
          if (hadiahProduct && hadiahProduct.varians.length > 0) {
            const hadiahVarian = hadiahProduct.varians[0];
            requiredBonuses.push({
              id: `bonus-${mainItem.id}`,
              barangId: hadiahProduct.id,
              nama: hadiahProduct.nama,
              kode: hadiahProduct.kode,
              varianId: hadiahVarian.id,
              unitName: hadiahVarian.unit?.name || "Pcs",
              harga: 0,
              qty: bonusQty,
              konversi: hadiahVarian.konversi || 1,
              maxStok: hadiahProduct.stok,
              isBonus: true,
              promoId: promo.id,
              bonusLabel: promo.nama,
              parentCartItemId: mainItem.id,
            });
          }
        }
      }
    }

    const nonAutoBonusItems = updatedCart.filter((item) => !item.parentCartItemId);
    return [...nonAutoBonusItems, ...requiredBonuses];
  };

  // Tambah produk reguler ke keranjang dengan kuantitas tertentu
  const addToCart = useCallback(
    (
      product: Product,
      varianIndex: number = 0,
      forceAsBonus: boolean = false,
      qtyToAdd: number = 1
    ) => {
      const varian =
        product.varians && product.varians.length > 0
          ? product.varians[varianIndex] || product.varians[0]
          : {
              id: `default-${product.id}`,
              hargaRetail: 0,
              hargaMember: 0,
              konversi: 1,
              unit: { name: "Pcs" },
            };

      if (forceAsBonus) {
        const newCartItem: CartItem = {
          id: generateId(),
          barangId: product.id,
          nama: product.nama,
          kode: product.kode,
          varianId: varian.id,
          unitName: varian.unit?.name || "Pcs",
          harga: 0,
          qty: qtyToAdd,
          konversi: varian.konversi || 1,
          maxStok: product.stok,
          isBonus: true,
          bonusLabel: "Bonus Manual",
        };
        setCart((prev) => [...prev, newCartItem]);
        playScanBeep();
        toast.success(`+ ${qtyToAdd}x Hadiah ${product.nama} (Rp 0) ditambahkan`);
        setSearch("");
        searchInputRef.current?.focus();
        return;
      }

      const harga = priceType === "retail" ? varian.hargaRetail : varian.hargaMember;

      const existingIndex = cart.findIndex(
        (item) =>
          !item.isBonus &&
          item.barangId === product.id &&
          item.varianId === varian.id &&
          item.harga === harga
      );

      let nextCart: CartItem[];
      if (existingIndex > -1) {
        nextCart = [...cart];
        nextCart[existingIndex].qty += qtyToAdd;
      } else {
        const newItemId = generateId();
        nextCart = [
          ...cart,
          {
            id: newItemId,
            barangId: product.id,
            nama: product.nama,
            kode: product.kode,
            varianId: varian.id,
            unitName: varian.unit?.name || "Pcs",
            harga: harga,
            qty: qtyToAdd,
            konversi: varian.konversi || 1,
            maxStok: product.stok,
            isBonus: false,
          },
        ];
      }

      const finalCart = applyPromoRules(nextCart);
      setCart(finalCart);
      playScanBeep();

      const promo = getActivePromoForProduct(product.id);
      if (promo) {
        toast.info(`✨ Promo: ${promo.nama} (Bonus otomatis disesuaikan)`, { icon: "🎁" });
      } else {
        toast.success(`+ ${qtyToAdd}x ${product.nama} masuk ke keranjang`);
      }

      setSearch("");
      searchInputRef.current?.focus();
    },
    [cart, priceType, initialProducts, initialPromos]
  );

  // Total dan Kembalian
  const total = useMemo(() => cart.reduce((acc, item) => acc + item.harga * item.qty, 0), [cart]);
  const kembali = useMemo(() => Math.max(0, bayar - total), [bayar, total]);

  // Set Uang Pas (Exact Cash)
  const setUangPas = useCallback(() => {
    if (total <= 0) {
      toast.error("Keranjang belanja masih kosong!");
      playErrorSound();
      return;
    }
    setBayar(total);
    toast.success(`Uang Pas: Rp ${total.toLocaleString("id-ID")}`);
  }, [total]);

  // Proses Checkout
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong!");
      playErrorSound();
      return;
    }
    if (bayar < total) {
      toast.error("Pembayaran kurang dari total tagihan!");
      playErrorSound();
      bayarInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        total,
        bayar,
        kembali,
        memberId: member?.id,
        items: cart.map((item) => ({
          barangId: item.barangId,
          varianId: item.varianId,
          qty: item.qty,
          hargaJual: item.harga,
          subtotal: item.harga * item.qty,
          konversi: item.konversi,
          isBonus: Boolean(item.isBonus),
          promoId: item.promoId,
        })),
      };

      const result = await createTransaksi(payload);
      if (result.success) {
        playSuccessChime();

        setReceiptData({
          invoice: result.invoice,
          total,
          bayar,
          kembali,
          date: new Date(),
          member: member ? { nama: member.nama, kode: member.kode } : null,
          items: cart.map((item) => ({
            nama: item.nama,
            unitName: item.unitName,
            qty: item.qty,
            harga: item.harga,
            isBonus: item.isBonus,
            bonusLabel: item.bonusLabel,
          })),
        });

        setIsReceiptOpen(true);
        setCart([]);
        setBayar(0);
      }
    } catch (error: any) {
      playErrorSound();
      toast.error(error.message || "Terjadi kesalahan saat memproses transaksi");
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, bayar, total, kembali, member]);

  // Handle Global Mouseless Hotkeys (F1 - F10, Esc)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isReceiptOpen) return;

      switch (e.key) {
        case "F1":
          e.preventDefault();
          setIsGuideOpen((prev) => !prev);
          break;

        case "F2":
          e.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
          break;

        case "F3":
          e.preventDefault();
          memberInputRef.current?.focus();
          memberInputRef.current?.select();
          break;

        case "F4":
          e.preventDefault();
          setPriceType((prev) => {
            const next = prev === "retail" ? "member" : "retail";
            toast.info(`Mode Harga beralih ke: ${next.toUpperCase()}`);
            return next;
          });
          break;

        case "F6":
          e.preventDefault();
          if (cart.length > 0) {
            lastQtyInputRef.current?.focus();
            lastQtyInputRef.current?.select();
            toast.info("Ubah kuantitas item terakhir [F6]");
          }
          break;

        case "F7":
          e.preventDefault();
          bayarInputRef.current?.focus();
          bayarInputRef.current?.select();
          break;

        case "F8":
          e.preventDefault();
          setUangPas();
          break;

        case "F9":
          e.preventDefault();
          if (cart.length > 0) {
            if (confirm("Kosongkan seluruh isi keranjang belanja?")) {
              setCart([]);
              setBayar(0);
              toast.info("Keranjang belanja dikosongkan");
              searchInputRef.current?.focus();
            }
          }
          break;

        case "F10":
          e.preventDefault();
          handleCheckout();
          break;

        case "Escape":
          if (isGuideOpen) {
            setIsGuideOpen(false);
          } else if (search) {
            setSearch("");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isReceiptOpen, isGuideOpen, search, cart, setUangPas, handleCheckout]);

  // Handle Keyboard Navigasi & Enter pada input pencarian barang
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredProducts.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredProducts.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredProducts.length) % filteredProducts.length);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const { multiplier, query } = parsedSearch;
      if (!query && multiplier === 1) return;

      // 1. Exact match barcode (kode)
      const exactMatch = initialProducts.find(
        (p) => p.kode.toLowerCase() === query.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch, 0, false, multiplier);
        return;
      }

      // 2. Selected index from dropdown (Navigasi Panah Keyboard / Item Teratas)
      if (filteredProducts.length > 0) {
        const targetProduct = filteredProducts[selectedIndex] || filteredProducts[0];
        addToCart(targetProduct, 0, false, multiplier);
        return;
      }

      playErrorSound();
      toast.error(`Barang "${query}" tidak ditemukan!`);
    }
  };

  // Handler saat kamera HP / Tablet berhasil membaca Barcode atau QR Code
  const handleCameraScan = (scannedCode: string) => {
    const cleanCode = scannedCode.trim();
    if (!cleanCode) return false;

    // 1. Cari exact match kode barcode produk
    const exactMatch = initialProducts.find(
      (p) => p.kode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (exactMatch) {
      addToCart(exactMatch, 0, false, 1);
      playSuccessChime();
      toast.success(`+ 1x ${exactMatch.nama} masuk keranjang`);
      return true;
    }

    // 2. Jika kode tidak cocok persis, cari yang mengandung kode
    const partialMatch = initialProducts.find(
      (p) =>
        p.kode.toLowerCase().includes(cleanCode.toLowerCase()) ||
        p.nama.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (partialMatch) {
      addToCart(partialMatch, 0, false, 1);
      playSuccessChime();
      toast.success(`+ 1x ${partialMatch.nama} masuk keranjang`);
      return true;
    }

    playErrorSound();
    toast.error(`Barcode "${cleanCode}" tidak terdaftar di sistem!`);
    return false;
  };

  // Tambah bonus B1G1 manual untuk baris item tertentu
  const addManualBonusRow = (item: CartItem) => {
    const product = initialProducts.find((p) => p.id === item.barangId);
    if (!product) return;

    const newBonusItem: CartItem = {
      id: generateId(),
      barangId: item.barangId,
      nama: item.nama,
      kode: item.kode,
      varianId: item.varianId,
      unitName: item.unitName,
      harga: 0,
      qty: 1,
      konversi: item.konversi,
      maxStok: item.maxStok,
      isBonus: true,
      bonusLabel: "Bonus (B1G1)",
    };

    setCart((prev) => [...prev, newBonusItem]);
    playScanBeep();
    toast.success(`Bonus 1x ${item.nama} (Rp 0) ditambahkan ke keranjang`);
  };

  // Update Qty item di keranjang (Step +/-)
  const updateQty = (id: string, delta: number) => {
    const updated = cart.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    });

    const finalCart = applyPromoRules(updated);
    setCart(finalCart);
  };

  // Update Qty langsung dari input angka
  const setQtyDirect = (id: string, newQty: number) => {
    const validQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
    const updated = cart.map((item) => {
      if (item.id === id) {
        return { ...item, qty: validQty };
      }
      return item;
    });

    const finalCart = applyPromoRules(updated);
    setCart(finalCart);
  };

  // Hapus item dari keranjang
  const removeFromCart = (id: string) => {
    const targetItem = cart.find((item) => item.id === id);
    let nextCart = cart.filter((item) => item.id !== id);

    if (targetItem && !targetItem.isBonus) {
      nextCart = nextCart.filter((item) => item.parentCartItemId !== id);
    }

    setCart(nextCart);
  };

  // Ganti satuan varian
  const changeVariant = (cartItemId: string, newVarianId: string) => {
    const updated = cart.map((item) => {
      if (item.id === cartItemId) {
        const product = initialProducts.find((p) => p.id === item.barangId);
        const varian = product?.varians.find((v: any) => v.id === newVarianId);

        if (varian) {
          const harga = item.isBonus
            ? 0
            : priceType === "retail"
            ? varian.hargaRetail
            : varian.hargaMember;

          return {
            ...item,
            varianId: newVarianId,
            unitName: varian.unit.name,
            harga: harga,
            konversi: varian.konversi,
          };
        }
      }
      return item;
    });

    setCart(applyPromoRules(updated));
  };

  // Ubah harga secara manual
  const updatePrice = (id: string, newPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const isNowFree = newPrice === 0;
          return {
            ...item,
            harga: newPrice,
            isBonus: isNowFree ? true : item.isBonus,
            bonusLabel: isNowFree && !item.bonusLabel ? "Gratis Manual" : item.bonusLabel,
          };
        }
        return item;
      })
    );
  };

  const findMember = () => {
    if (!memberSearch) return;
    const found = initialMembers.find(
      (m) =>
        m.nama.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.kode.toLowerCase() === memberSearch.toLowerCase() ||
        m.telepon === memberSearch
    );
    if (found) {
      setMember(found);
      setPriceType("member");
      setMemberSearch("");
      playScanBeep();
      toast.success(`Member ditemukan: ${found.nama}`);
      searchInputRef.current?.focus();
    } else {
      playErrorSound();
      toast.error("Member tidak ditemukan");
    }
  };

  const removeMember = () => {
    setMember(null);
    setPriceType("retail");
    toast.info("Member dihapus, beralih ke harga retail");
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6 h-full p-1 pb-24 lg:pb-1 relative">
      {/* Mobile & Tablet Tab Switcher (< 1024px) */}
      <div className="flex lg:hidden w-full bg-muted/80 p-1 rounded-xl gap-1 shrink-0 sticky top-0 z-30 shadow-xs backdrop-blur">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mobileTab === "catalog"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Search className="w-4 h-4 text-primary" />
          <span>Produk & Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all relative ${
            mobileTab === "cart"
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span>Keranjang Belanja</span>
          {cart.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-primary text-primary-foreground">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Left Side: Product Search & Selection (Scrollable) */}
      <div
        className={`lg:col-span-7 flex flex-col gap-4 overflow-y-auto lg:h-full pr-1 custom-scrollbar ${
          mobileTab === "cart" ? "hidden lg:flex" : "flex"
        }`}
      >
        <Card className="overflow-visible z-20 shadow-sm">
          <CardHeader className="pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Cari / Scan Produk
              </CardTitle>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border">
                F2
              </kbd>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Link href="/dashboard/pengaturan">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground px-2 sm:px-3"
                  title="Pengaturan Toko & Printer"
                >
                  <Settings className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Pengaturan</span>
                </Button>
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsGuideOpen(true)}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground px-2 sm:px-3"
                title="Panduan Tombol Keyboard Kasir (F1)"
              >
                <Keyboard className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Shortcut</span> [F1]
              </Button>

              <div className="flex bg-muted p-0.5 sm:p-1 rounded-md">
                <Button
                  variant={priceType === "retail" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPriceType("retail")}
                >
                  Retail
                </Button>
                <Button
                  variant={priceType === "member" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setPriceType("member")}
                >
                  Member <span className="hidden md:inline">[F4]</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="overflow-visible space-y-2.5">
            {/* Input Search Barcode dengan Dukungan Multiplier (Contoh: 10*kopi) */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  placeholder="Scan barcode, ketik nama, atau 10*nama_barang... [F2]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-10 h-12 text-base font-medium shadow-inner rounded-xl"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />

                {/* Indicator Multiplier Badge jika kasir mengetik misal: 10* */}
                {parsedSearch.multiplier > 1 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground font-black text-xs px-2 py-1 rounded-md shadow-xs animate-in fade-in zoom-in">
                    Qty: {parsedSearch.multiplier}x
                  </div>
                )}

                {/* Dropdown Hasil Pencarian dengan Navigasi Panah Keyboard (Up/Down) */}
                {filteredProducts.length > 0 && (
                  <div
                    ref={dropdownListRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-2xl z-50 divide-y max-h-[360px] overflow-y-auto overscroll-contain"
                  >
                    {filteredProducts.map((p, idx) => {
                      const activePromo = getActivePromoForProduct(p.id);
                      const isSelected = idx === selectedIndex;

                      return (
                        <div
                          key={p.id}
                          data-item-index={idx}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            addToCart(p, 0, false, parsedSearch.multiplier);
                          }}
                          className={`p-3 flex items-center justify-between transition-colors cursor-pointer select-none ${
                            isSelected
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{p.nama}</p>
                              {activePromo && (
                                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Gift className="w-3 h-3" /> PROMO B1G1 / HADIAH
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Kode: {p.kode} | Stok: {p.stok}
                            </p>
                          </div>
                          <div className="flex gap-1 items-center">
                            {p.varians.map((v: any, vIdx: number) => {
                              const currentPrice =
                                priceType === "retail" ? v.hargaRetail : v.hargaMember;
                              return (
                                <Button
                                  key={v.id}
                                  variant="outline"
                                  size="sm"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart(p, vIdx, false, parsedSearch.multiplier);
                                  }}
                                  className="h-8 text-xs px-2.5 flex flex-col items-end py-1 font-semibold"
                                >
                                  <span>{v.unit.name}</span>
                                  <span className="text-[10px] text-primary font-mono">
                                    Rp {currentPrice.toLocaleString("id-ID")}
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tombol Kamera Scan Barcode & QR: KHUSUS HP & TABLET (< 1024px) */}
              <Button
                type="button"
                variant="default"
                onClick={() => setIsCameraOpen(true)}
                className="lg:hidden h-12 px-3.5 sm:px-4 shrink-0 gap-1.5 font-bold shadow-xs bg-primary text-primary-foreground rounded-xl"
                title="Pindai Barcode / QR dengan Kamera HP / Tablet"
              >
                <ScanBarcode className="w-5 h-5" />
                <span className="hidden xs:inline text-xs">Scan</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cart Display */}
        <Card className="flex-1 overflow-hidden flex flex-col shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Keranjang Belanja
              </CardTitle>
              <span className="text-xs text-muted-foreground font-medium">
                ({cart.length} Baris Item)
              </span>
            </div>

            {cart.length > 0 && (
              <div className="flex items-center gap-2">
                <kbd className="text-[10px] text-muted-foreground font-mono">
                  [F6] Ubah Qty
                </kbd>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Kosongkan keranjang belanja?")) {
                      setCart([]);
                      setBayar(0);
                    }
                  }}
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                  title="Kosongkan Keranjang [F9]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Batal [F9]
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="w-[140px]">Kuantitas (Qty)</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-36 text-center text-muted-foreground">
                      <p className="font-semibold text-sm">Keranjang masih kosong.</p>
                      <p className="text-xs mt-1">
                        Ketik <strong>10*nama_barang</strong> atau tekan <strong>[F2]</strong> untuk mulai mencari.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item, index) => {
                    const isLastItem = index === cart.length - 1;

                    return (
                      <TableRow
                        key={item.id}
                        className={
                          item.isBonus
                            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{item.nama}</p>
                              {item.isBonus && (
                                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-400/50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Gift className="w-3 h-3" /> GRATIS / PROMO
                                </span>
                              )}
                            </div>

                            {item.bonusLabel && item.isBonus && (
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ✨ {item.bonusLabel}
                              </p>
                            )}

                            {/* Variant Selector */}
                            <div className="flex items-center gap-2 mt-1">
                              {(() => {
                                const product = initialProducts.find(
                                  (p) => p.id === item.barangId
                                );
                                const hasMultipleVarians = (product?.varians?.length || 0) > 1;

                                if (!hasMultipleVarians) {
                                  return (
                                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                      {item.unitName}
                                    </span>
                                  );
                                }

                                return (
                                  <Select
                                    value={item.varianId}
                                    onValueChange={(val) => changeVariant(item.id, val)}
                                  >
                                    <SelectTrigger className="h-7 w-fit text-xs px-2 py-0">
                                      <SelectValue placeholder="Pilih Satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {product?.varians.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id} className="text-xs">
                                          {v.unit.name} (Rp{" "}
                                          {(item.isBonus
                                            ? 0
                                            : priceType === "retail"
                                            ? v.hargaRetail
                                            : v.hargaMember
                                          ).toLocaleString("id-ID")}
                                          )
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                );
                              })()}

                              {/* Tombol Shortcut Tambah Bonus Cepat jika barang reguler punya promo B1G1 */}
                              {!item.isBonus && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addManualBonusRow(item)}
                                  className="h-6 px-1.5 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  title="Tambahkan 1 item bonus B1G1 untuk produk ini"
                                >
                                  <Gift className="w-3 h-3 mr-1" /> + Bonus
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="relative w-24">
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                              Rp
                            </span>
                            <Input
                              type="number"
                              value={item.harga}
                              onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                              className={`h-8 pl-6 text-xs font-medium ${
                                item.isBonus ? "text-emerald-600 font-bold bg-emerald-50/50" : ""
                              }`}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {/* Input Qty Langsung & Tombol +/- */}
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-md"
                              onClick={() => updateQty(item.id, -1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>

                            <Input
                              ref={isLastItem ? lastQtyInputRef : undefined}
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => setQtyDirect(item.id, parseInt(e.target.value, 10))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  searchInputRef.current?.focus();
                                }
                              }}
                              className="h-8 w-12 sm:w-14 text-center font-bold text-xs p-1 bg-background"
                            />

                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0 rounded-md"
                              onClick={() => updateQty(item.id, 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          {item.isBonus ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Rp 0
                            </span>
                          ) : (
                            <span>Rp {(item.harga * item.qty).toLocaleString("id-ID")}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Right Side: Member & Payment Summary */}
      <div
        className={`lg:col-span-5 flex flex-col gap-4 lg:h-full overflow-y-auto pr-1 ${
          mobileTab === "catalog" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* On mobile / tablet < lg, show quick navigation back to catalog */}
        <div className="lg:hidden flex items-center justify-between pb-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setMobileTab("catalog")}
            className="text-xs text-primary gap-1 font-semibold pl-0 hover:bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" /> Tambah Produk Lain
          </Button>
          <span className="text-xs font-bold text-muted-foreground">
            {cart.length} Baris Produk
          </span>
        </div>
        {/* Member Section */}
        <Card className={`${member ? "border-primary bg-primary/5" : ""} overflow-visible z-20 shadow-sm`}>
          <CardHeader className="pb-2.5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" /> Pelanggan / Member
            </CardTitle>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded border">
              F3
            </kbd>
          </CardHeader>
          <CardContent className="overflow-visible">
            {!member ? (
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    ref={memberInputRef}
                    placeholder="Nama, Kode, atau Telp... [F3]"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && findMember()}
                    className="h-10 text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={findMember} className="shrink-0 h-10 w-10">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {filteredMembers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-2xl z-50 divide-y overflow-hidden">
                    {filteredMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => {
                          setMember(m);
                          setPriceType("member");
                          setMemberSearch("");
                          playScanBeep();
                          toast.success(`Member terpilih: ${m.nama}`);
                          searchInputRef.current?.focus();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <div>
                            <p className="font-semibold text-sm leading-tight">{m.nama}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {m.kode} | {m.telepon || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between bg-background p-3 rounded-md border border-primary/50 shadow-sm animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <UserCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{member.nama}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{member.kode}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeMember}
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  title="Hapus Member"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ringkasan Pembayaran */}
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Ringkasan Pembayaran</CardTitle>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background text-primary rounded border font-bold">
              F7: Bayar | F8: Pas
            </kbd>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex justify-between items-end border-b pb-4">
              <span className="text-muted-foreground font-semibold">Total Tagihan</span>
              <span className="text-3xl font-black text-primary tracking-tight">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bayar Uang Tunai (Cash)
                </label>
                <span className="text-[11px] text-muted-foreground">Tekan [F7]</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                  Rp
                </span>
                <Input
                  ref={bayarInputRef}
                  type="number"
                  value={bayar || ""}
                  onChange={(e) => setBayar(Number(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                  className="pl-10 h-14 text-2xl font-bold font-mono bg-background"
                  placeholder="0"
                />
              </div>

              {/* Shortcut Uang Pas & Pecahan Responsif */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={setUangPas}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 shadow-xs"
                  title="Bayar Uang Pas [F8]"
                >
                  <Coins className="w-3.5 h-3.5 mr-1" /> Uang Pas
                </Button>
                {[20000, 50000, 100000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBayar(amt)}
                    className="text-xs font-semibold h-10 hover:bg-accent"
                  >
                    +{amt.toLocaleString("id-ID")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center bg-background p-4 rounded-xl border shadow-xs">
              <span className="text-muted-foreground font-medium">Uang Kembalian</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">
                Rp {kembali.toLocaleString("id-ID")}
              </span>
            </div>

            <Button
              className="w-full h-16 text-lg font-bold gap-2 shadow-md"
              disabled={cart.length === 0 || bayar < total || isSubmitting}
              onClick={handleCheckout}
            >
              <CreditCard className="w-6 h-6" />
              {isSubmitting ? "Memproses..." : "PROSES BAYAR [F10]"}
            </Button>
          </CardContent>
        </Card>

        {/* Informasi Promo & Shortcut Keyboard */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> Tips Perkalian & Shortcut
              </span>
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsGuideOpen(true)}
                className="h-auto p-0 text-xs text-primary"
              >
                Lihat Semua [F1]
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-[11px] space-y-1 text-muted-foreground">
            <p>• Ketik <strong>10*nama_barang</strong> (misal <code>10*kopi</code>) lalu tekan <strong>Enter</strong>.</p>
            <p>• Gunakan panah <strong>[↑] [↓]</strong> untuk memilih hasil pencarian.</p>
            <p>• Tekan <strong>[F6]</strong> untuk mengubah Qty barang terakhir.</p>
          </CardContent>
        </Card>
      </div>

      {/* Floating Bottom Bar for Mobile & Tablet (< 1024px) when on Catalog tab */}
      {mobileTab === "catalog" && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-foreground text-background dark:bg-zinc-900 dark:text-zinc-100 p-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground truncate font-medium">
              {cart.reduce((a, c) => a + c.qty, 0)} pcs ({cart.length} item)
            </p>
            <p className="text-base font-black font-mono tracking-tight text-background dark:text-primary">
              Rp {total.toLocaleString("id-ID")}
            </p>
          </div>

          <Button
            onClick={() => setMobileTab("cart")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs h-10 px-4 rounded-xl shrink-0 shadow-md gap-1"
          >
            Bayar <ArrowRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      )}

      {/* Modal Cetak Struk Thermal */}
      <ReceiptModal
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        data={receiptData}
        onNewTransaction={() => {
          setIsReceiptOpen(false);
          searchInputRef.current?.focus();
        }}
      />

      {/* Dialog Scanner Kamera Barcode & QR (Khusus HP & Tablet) */}
      <CameraScannerDialog
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onScan={handleCameraScan}
      />

      {/* Dialog Panduan Shortcut Keyboard */}
      <KeyboardGuideDialog open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </div>
  );
}

export default POSClient;
