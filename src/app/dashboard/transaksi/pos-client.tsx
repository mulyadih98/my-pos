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
  Keyboard,
  Coins,
  Settings,
  ArrowRight,
  ChevronLeft,
  ScanBarcode,
  Camera,
  PauseCircle,
  PlayCircle,
  Percent,
  QrCode,
  ArrowLeftRight,
  Wallet,
  Clock,
  BookOpenCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTransaksi } from "@/app/actions/transaksi";
import { searchKasbonForPOS } from "@/app/actions/kasbon";
import { toast } from "sonner";
import { playScanBeep, playSuccessChime, playErrorSound } from "@/lib/sound";
import { ReceiptModal, ReceiptData } from "@/components/receipt-modal";
import { KeyboardGuideDialog } from "@/components/keyboard-guide-dialog";
import { CameraScannerDialog } from "@/components/pos/camera-scanner-dialog";
import { BayarKasbonDialog } from "@/components/pos/bayar-kasbon-dialog";
import { generateId } from "@/lib/utils";
import { UserSession } from "@/lib/auth";

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

interface HeldOrder {
  id: string;
  label: string;
  createdAt: string;
  cart: CartItem[];
  member: Member | null;
  priceType: "retail" | "member";
  discountType: "persen" | "nominal";
  discountValue: number;
  catatan: string;
}

export function POSClient({
  initialProducts,
  initialMembers,
  initialPromos = [],
  currentUser,
}: {
  initialProducts: Product[];
  initialMembers: Member[];
  initialPromos?: PromoRule[];
  currentUser?: UserSession | null;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [memberSearch, setMemberSearch] = useState("");
  const [member, setMember] = useState<Member | null>(null);
  const [priceType, setPriceType] = useState<"retail" | "member">("retail");
  const [bayar, setBayar] = useState<number>(0);
  const [metodePembayaran, setMetodePembayaran] = useState<"TUNAI" | "QRIS" | "TRANSFER" | "DEBIT" | "HUTANG">("TUNAI");
  const [referensiPembayaran, setReferensiPembayaran] = useState<string>("");
  const [discountType, setDiscountType] = useState<"persen" | "nominal">("persen");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [catatan, setCatatan] = useState<string>("");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Kasbon / Hutang States
  const [kasbonNama, setKasbonNama] = useState<string>("");
  const [kasbonTelepon, setKasbonTelepon] = useState<string>("");
  const [kasbonDp, setKasbonDp] = useState<number>(0);
  const [kasbonJatuhTempo, setKasbonJatuhTempo] = useState<string>("");
  const [customerKasbon, setCustomerKasbon] = useState<any | null>(null);
  const [isPotongKembalian, setIsPotongKembalian] = useState<boolean>(false);
  const [potongKembalianJumlah, setPotongKembalianJumlah] = useState<number>(0);

  // Dialog States
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBayarKasbonOpen, setIsBayarKasbonOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // DOM Refs for Keyboard-First navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const memberInputRef = useRef<HTMLInputElement>(null);
  const bayarInputRef = useRef<HTMLInputElement>(null);
  const lastQtyInputRef = useRef<HTMLInputElement>(null);
  const dropdownListRef = useRef<HTMLDivElement>(null);

  // Auto-focus barcode input on mount & load held orders
  useEffect(() => {
    searchInputRef.current?.focus();
    try {
      const saved = localStorage.getItem("mypos_held_orders");
      if (saved) {
        setHeldOrders(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveHeldOrders = (orders: HeldOrder[]) => {
    setHeldOrders(orders);
    try {
      localStorage.setItem("mypos_held_orders", JSON.stringify(orders));
    } catch {}
  };

  // Cek apakah pelanggan memiliki akun kasbon dengan saldo aktif
  const checkKasbonForCustomer = async (nama: string) => {
    if (!nama || nama.trim().length === 0) {
      setCustomerKasbon(null);
      return;
    }
    try {
      const list = await searchKasbonForPOS(nama.trim());
      const matched = list.find(
        (k: any) => k.namaPelanggan.toLowerCase() === nama.trim().toLowerCase()
      );
      if (matched && matched.saldoHutang > 0) {
        setCustomerKasbon(matched);
      } else {
        setCustomerKasbon(null);
      }
    } catch {
      setCustomerKasbon(null);
    }
  };

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

        const product = products.find((p) => p.id === item.barangId);
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
  }, [priceType, products]);

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

    return products
      .filter((p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q))
      .slice(0, 30);
  }, [parsedSearch.query, products]);

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
          const hadiahProduct = products.find((p) => p.id === promo.barangHadiahId);
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
        return true;
      }

      // Validasi ketersediaan stok fisik barang
      const konversi = varian.konversi || 1;
      const requestedPcs = qtyToAdd * konversi;
      const alreadyInCartPcs = cart
        .filter((item) => item.barangId === product.id)
        .reduce((sum, item) => sum + item.qty * (item.konversi || 1), 0);

      if (product.stok <= 0) {
        playErrorSound();
        toast.error(`Stok barang "${product.nama}" habis (0 pcs)!`);
        setSearch("");
        searchInputRef.current?.focus();
        return false;
      }

      if (alreadyInCartPcs + requestedPcs > product.stok) {
        playErrorSound();
        toast.error(
          `Stok tidak mencukupi untuk "${product.nama}". Sisa stok: ${product.stok} pcs, sudah di keranjang: ${alreadyInCartPcs} pcs.`
        );
        setSearch("");
        searchInputRef.current?.focus();
        return false;
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
      return true;
    },
    [cart, priceType, products, initialPromos]
  );

  // Subtotal kotor sebelum diskon transaksi
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.harga * item.qty, 0), [cart]);

  // Nominal diskon transaksi
  const diskonNominal = useMemo(() => {
    if (discountValue <= 0 || subtotal <= 0) return 0;
    if (discountType === "persen") {
      const pct = Math.min(100, Math.max(0, discountValue));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  // Persentase diskon
  const diskonPersen = useMemo(() => {
    if (discountType === "persen") return Math.min(100, Math.max(0, discountValue));
    if (subtotal > 0 && diskonNominal > 0) {
      return Math.round((diskonNominal / subtotal) * 100);
    }
    return 0;
  }, [discountType, discountValue, subtotal, diskonNominal]);

  // Total tagihan bersih setelah diskon
  const total = useMemo(() => Math.max(0, subtotal - diskonNominal), [subtotal, diskonNominal]);

  // Kembalian kotor dari pembayaran tunai
  const kembalianBruto = useMemo(() => {
    if (metodePembayaran !== "TUNAI") return 0;
    return Math.max(0, bayar - total);
  }, [metodePembayaran, bayar, total]);

  // Nominal potong kembalian yang efektif untuk cicil kasbon
  const effectivePotongKembalian = useMemo(() => {
    if (!isPotongKembalian || !customerKasbon || customerKasbon.saldoHutang <= 0) return 0;
    return Math.min(kembalianBruto, customerKasbon.saldoHutang, Math.max(0, potongKembalianJumlah));
  }, [isPotongKembalian, customerKasbon, kembalianBruto, potongKembalianJumlah]);

  // Kembalian bersih tunai yang diserahkan ke pelanggan
  const kembali = useMemo(() => {
    if (metodePembayaran !== "TUNAI") return 0;
    return Math.max(0, kembalianBruto - effectivePotongKembalian);
  }, [metodePembayaran, kembalianBruto, effectivePotongKembalian]);

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

  // Tahan Transaksi (Hold Order)
  const handleHoldOrder = useCallback(() => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong!");
      return;
    }
    const totalPcs = cart.reduce((a, c) => a + c.qty, 0);
    const defaultLabel = `Antrean #${heldOrders.length + 1} (${totalPcs} pcs)`;
    const label = window.prompt("Nama / Keterangan Antrean:", defaultLabel);
    if (label === null) return;

    const newOrder: HeldOrder = {
      id: generateId(),
      label: label.trim() || defaultLabel,
      createdAt: new Date().toISOString(),
      cart,
      member,
      priceType,
      discountType,
      discountValue,
      catatan,
    };

    const updated = [newOrder, ...heldOrders];
    saveHeldOrders(updated);

    // Reset keranjang aktif
    setCart([]);
    setMember(null);
    setDiscountValue(0);
    setCatatan("");
    setBayar(0);
    setReferensiPembayaran("");
    toast.success(`Transaksi "${newOrder.label}" berhasil ditahan!`);
    searchInputRef.current?.focus();
  }, [cart, heldOrders, member, priceType, discountType, discountValue, catatan]);

  const handleRecallOrder = useCallback(
    (order: HeldOrder) => {
      if (cart.length > 0) {
        if (!confirm("Isi keranjang saat ini akan digantikan oleh antrean ini. Lanjutkan?")) return;
      }

      setCart(order.cart);
      setMember(order.member);
      setPriceType(order.priceType);
      setDiscountType(order.discountType);
      setDiscountValue(order.discountValue);
      setCatatan(order.catatan || "");
      setBayar(0);

      const filtered = heldOrders.filter((h) => h.id !== order.id);
      saveHeldOrders(filtered);
      setIsRecallOpen(false);
      toast.success(`Antrean "${order.label}" berhasil dibuka kembali!`);
      searchInputRef.current?.focus();
    },
    [cart, heldOrders]
  );

  const handleDeleteHeldOrder = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Hapus antrean tersimpan ini?")) {
        const filtered = heldOrders.filter((h) => h.id !== id);
        saveHeldOrders(filtered);
        toast.info("Antrean dihapus.");
      }
    },
    [heldOrders]
  );

  // Proses Checkout
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      toast.error("Keranjang belanja masih kosong!");
      playErrorSound();
      return;
    }

    let effectiveBayar = 0;
    let effectiveKembali = 0;

    if (metodePembayaran === "TUNAI") {
      if (bayar < total) {
        toast.error("Pembayaran tunai kurang dari total tagihan!");
        playErrorSound();
        bayarInputRef.current?.focus();
        return;
      }
      effectiveBayar = bayar;
      effectiveKembali = kembali;
    } else if (metodePembayaran === "HUTANG") {
      const namaPelangganFinal = (member?.nama || kasbonNama || "").trim();
      if (!namaPelangganFinal) {
        toast.error("Nama pelanggan wajib diisi untuk transaksi kasbon/hutang!");
        playErrorSound();
        return;
      }
      if (kasbonDp > total) {
        toast.error("Uang muka (DP) tidak boleh melebihi total tagihan!");
        playErrorSound();
        return;
      }
      effectiveBayar = Math.max(0, kasbonDp);
      effectiveKembali = 0;
    } else {
      effectiveBayar = total;
      effectiveKembali = 0;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subtotal,
        diskonPersen,
        diskonNominal,
        total,
        metodePembayaran,
        referensiPembayaran: referensiPembayaran ? referensiPembayaran.trim() : undefined,
        bayar: effectiveBayar,
        kembali: effectiveKembali,
        catatan: catatan ? catatan.trim() : undefined,
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

        // Integrasi Kasbon
        kasbonNamaPelanggan: (member?.nama || kasbonNama || "").trim() || undefined,
        kasbonTelepon: kasbonTelepon.trim() || undefined,
        kasbonJatuhTempo: kasbonJatuhTempo || null,
        potongKembalianKasbonId:
          isPotongKembalian && effectivePotongKembalian > 0 && customerKasbon
            ? customerKasbon.id
            : undefined,
        potongKembalianJumlah: effectivePotongKembalian,
      };

      const result = await createTransaksi(payload);
      if (!result.success) {
        playErrorSound();
        toast.error(result.error || "Gagal memproses transaksi.");
        return;
      }

      playSuccessChime();

      setReceiptData({
        invoice: result.invoice,
        subtotal,
        diskonPersen,
        diskonNominal,
        total,
        metodePembayaran,
        referensiPembayaran: referensiPembayaran ? referensiPembayaran.trim() : null,
        bayar: effectiveBayar,
        kembali: effectiveKembali,
        catatan: catatan ? catatan.trim() : null,
        status: "SELESAI",
        date: new Date(),
        member: member ? { nama: member.nama, kode: member.kode } : null,
        kasirNama: result.kasirNama || currentUser?.nama || currentUser?.username || "Kasir",
        items: cart.map((item) => ({
          nama: item.nama,
          unitName: item.unitName,
          qty: item.qty,
          harga: item.harga,
          isBonus: item.isBonus,
          bonusLabel: item.bonusLabel,
        })),

        // Kasbon Struk Info
        receiptType: "TRANSAKSI",
        namaPelanggan:
          result.kasbonInfo?.namaPelanggan || (member ? member.nama : kasbonNama) || null,
        tambahHutang: result.kasbonInfo?.tambahHutang,
        potongKembalian: result.kasbonInfo?.potongKembalian,
        saldoHutangAkhir: result.kasbonInfo?.saldoAkhir,
        jatuhTempo:
          result.kasbonInfo?.jatuhTempo || (kasbonJatuhTempo ? new Date(kasbonJatuhTempo) : null),
      });

      setIsReceiptOpen(true);

      // Kurangi stok barang lokal langsung agar tampilan kasir langsung update
      setProducts((prev) =>
        prev.map((p) => {
          const soldItems = cart.filter((c) => c.barangId === p.id);
          if (soldItems.length > 0) {
            const totalSoldPcs = soldItems.reduce((acc, c) => acc + c.qty * (c.konversi || 1), 0);
            return { ...p, stok: Math.max(0, p.stok - totalSoldPcs) };
          }
          return p;
        })
      );

      // Refresh data di background
      router.refresh();

      setCart([]);
      setBayar(0);
      setKasbonDp(0);
      setKasbonNama("");
      setKasbonTelepon("");
      setKasbonJatuhTempo("");
      setIsPotongKembalian(false);
      setPotongKembalianJumlah(0);
      setCustomerKasbon(null);
      setReferensiPembayaran("");
      setDiscountValue(0);
      setCatatan("");
    } catch (error: any) {
      playErrorSound();
      toast.error(error.message || "Terjadi kesalahan saat memproses transaksi");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cart,
    subtotal,
    diskonPersen,
    diskonNominal,
    total,
    metodePembayaran,
    referensiPembayaran,
    bayar,
    kembali,
    catatan,
    member,
    kasbonNama,
    kasbonTelepon,
    kasbonDp,
    kasbonJatuhTempo,
    isPotongKembalian,
    effectivePotongKembalian,
    customerKasbon,
  ]);

  // Handle Global Mouseless Hotkeys (F1 - F10, Esc, Alt+1..5, Alt+H, Alt+R, Alt+B)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isReceiptOpen || isBayarKasbonOpen) return;

      if (e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setMetodePembayaran("TUNAI");
          toast.info("Metode Pembayaran: TUNAI");
          return;
        } else if (e.key === "2") {
          e.preventDefault();
          setMetodePembayaran("QRIS");
          setBayar(total);
          toast.info("Metode Pembayaran: QRIS");
          return;
        } else if (e.key === "3") {
          e.preventDefault();
          setMetodePembayaran("TRANSFER");
          setBayar(total);
          toast.info("Metode Pembayaran: TRANSFER");
          return;
        } else if (e.key === "4") {
          e.preventDefault();
          setMetodePembayaran("DEBIT");
          setBayar(total);
          toast.info("Metode Pembayaran: DEBIT");
          return;
        } else if (e.key === "5") {
          e.preventDefault();
          setMetodePembayaran("HUTANG");
          setBayar(0);
          toast.info("Metode Pembayaran: HUTANG (KASBON)");
          return;
        } else if (e.key.toLowerCase() === "h") {
          e.preventDefault();
          handleHoldOrder();
          return;
        } else if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          setIsRecallOpen(true);
          return;
        } else if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          setIsBayarKasbonOpen(true);
          return;
        }
      }

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
  }, [isReceiptOpen, isGuideOpen, search, cart, total, setUangPas, handleCheckout, handleHoldOrder]);

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
      const exactMatch = products.find(
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
    const exactMatch = products.find(
      (p) => p.kode.toLowerCase() === cleanCode.toLowerCase()
    );

    if (exactMatch) {
      return addToCart(exactMatch, 0, false, 1);
    }

    // 2. Jika kode tidak cocok persis, cari yang mengandung kode
    const partialMatch = products.find(
      (p) =>
        p.kode.toLowerCase().includes(cleanCode.toLowerCase()) ||
        p.nama.toLowerCase().includes(cleanCode.toLowerCase())
    );

    if (partialMatch) {
      return addToCart(partialMatch, 0, false, 1);
    }

    playErrorSound();
    toast.error(`Barcode "${cleanCode}" tidak terdaftar di sistem!`);
    return false;
  };

  // Tambah bonus B1G1 manual untuk baris item tertentu
  const addManualBonusRow = (item: CartItem) => {
    const product = products.find((p) => p.id === item.barangId);
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
    const targetItem = cart.find((item) => item.id === id);
    if (!targetItem) return;

    if (delta > 0) {
      const konversi = targetItem.konversi || 1;
      const currentInCartPcs = cart
        .filter((c) => c.barangId === targetItem.barangId)
        .reduce((sum, c) => sum + c.qty * (c.konversi || 1), 0);

      if (currentInCartPcs + delta * konversi > targetItem.maxStok) {
        playErrorSound();
        toast.error(`Tidak bisa menambah. Stok tersedia hanya ${targetItem.maxStok} pcs.`);
        return;
      }
    }

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
    const targetItem = cart.find((item) => item.id === id);
    if (!targetItem) return;

    const konversi = targetItem.konversi || 1;
    const otherInCartPcs = cart
      .filter((c) => c.barangId === targetItem.barangId && c.id !== id)
      .reduce((sum, c) => sum + c.qty * (c.konversi || 1), 0);

    const maxAllowedQty = Math.max(1, Math.floor((targetItem.maxStok - otherInCartPcs) / konversi));
    let validQty = Math.max(1, isNaN(newQty) ? 1 : newQty);

    if (validQty > maxAllowedQty) {
      playErrorSound();
      toast.warning(`Jumlah disesuaikan dengan stok maksimal yang tersedia (${maxAllowedQty})`);
      validQty = maxAllowedQty;
    }

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
        const product = products.find((p) => p.id === item.barangId);
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
      setKasbonNama(found.nama);
      setKasbonTelepon(found.telepon || "");
      checkKasbonForCustomer(found.nama);
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
    setCustomerKasbon(null);
    setKasbonNama("");
    setKasbonTelepon("");
    setIsPotongKembalian(false);
    setPotongKembalianJumlah(0);
    toast.info("Member dihapus, beralih ke harga retail");
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-3.5 h-full p-0.5 pb-24 lg:pb-0 relative min-h-0">
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
        className={`lg:col-span-7 flex flex-col gap-2.5 overflow-y-auto lg:h-full min-h-0 pr-1 custom-scrollbar ${
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBayarKasbonOpen(true)}
                className="h-8 text-xs gap-1 text-amber-600 border-amber-300 bg-amber-50/50 hover:bg-amber-100 dark:hover:bg-amber-950/40 px-2 sm:px-3 font-semibold shadow-xs"
                title="Pembayaran Kasbon / Hutang Pelanggan (Alt + B)"
              >
                <BookOpenCheck className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Bayar Kasbon</span> <span className="hidden sm:inline font-mono">[Alt+B]</span>
              </Button>

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
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                              <span>Kode: {p.kode}</span>
                              <span>&bull;</span>
                              <span className={p.stok <= 0 ? "text-destructive font-bold" : p.stok <= 5 ? "text-amber-600 font-semibold" : "font-medium"}>
                                Stok: {p.stok} {p.stok <= 0 ? "(Habis)" : "pcs"}
                              </span>
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

            <div className="flex items-center gap-1.5 sm:gap-2">
              {heldOrders.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecallOpen(true)}
                  className="h-7 px-2 text-xs font-bold text-amber-600 border-amber-400 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 gap-1"
                  title="Buka Antrean Tersimpan [Alt+R]"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Antrean</span>
                  <span className="bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-900 rounded-full px-1.5 py-0.2 text-[10px]">
                    {heldOrders.length}
                  </span>
                </Button>
              )}

              {cart.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHoldOrder}
                    className="h-7 px-2 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1 border-amber-300"
                    title="Tahan transaksi ini sementara agar bisa melayani antrean lain [Alt+H]"
                  >
                    <PauseCircle className="w-3.5 h-3.5" /> Tahan
                  </Button>

                  <kbd className="hidden sm:inline-block text-[10px] text-muted-foreground font-mono">
                    [F6] Qty
                  </kbd>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm("Kosongkan keranjang belanja?")) {
                        setCart([]);
                        setBayar(0);
                        setDiscountValue(0);
                        setCatatan("");
                      }
                    }}
                    className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                    title="Kosongkan Keranjang [F9]"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Batal
                  </Button>
                </>
              )}
            </div>
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
                                const product = products.find(
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
        className={`lg:col-span-5 flex flex-col gap-2.5 lg:h-full min-h-0 ${
          mobileTab === "catalog" ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* On mobile / tablet < lg, show quick navigation back to catalog */}
        <div className="lg:hidden flex items-center justify-between pb-1 shrink-0">
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

        {/* Member Section (Compact & Sleek) */}
        <div className={`p-2.5 rounded-xl border bg-card shadow-2xs shrink-0 transition-all ${member ? "border-primary/40 bg-primary/5" : ""}`}>
          {!member ? (
            <div className="relative">
              <div className="flex gap-1.5 items-center">
                <div className="relative flex-1">
                  <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={memberInputRef}
                    placeholder="Pelanggan / Member [F3]..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && findMember()}
                    className="h-8 text-xs pl-8 bg-background"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={findMember} className="h-8 px-2.5 text-xs shrink-0 gap-1">
                  <Search className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cari</span>
                </Button>
              </div>

              {filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-2xl z-50 divide-y overflow-hidden max-h-48 overflow-y-auto">
                  {filteredMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        setMember(m);
                        setPriceType("member");
                        setMemberSearch("");
                        setKasbonNama(m.nama);
                        setKasbonTelepon(m.telepon || "");
                        checkKasbonForCustomer(m.nama);
                        playScanBeep();
                        toast.success(`Member terpilih: ${m.nama}`);
                        searchInputRef.current?.focus();
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs leading-tight truncate">{m.nama}</p>
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
            <div className="space-y-1.5">
              <div className="flex items-center justify-between bg-background p-2 rounded-lg border border-primary/30 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="bg-primary/10 p-1.5 rounded-full shrink-0">
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs leading-none truncate">{member.nama}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{member.kode}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeMember}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  title="Hapus Member"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>

              {customerKasbon && customerKasbon.saldoHutang > 0 && (
                <div className="p-1.5 px-2.5 bg-amber-500/10 border border-amber-500/30 rounded-md flex items-center justify-between text-xs">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3 h-3 text-amber-500" /> Saldo Kasbon:
                  </span>
                  <span className="font-mono font-black text-amber-600 text-xs">
                    Rp {customerKasbon.saldoHutang.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Unified Payment Card with Scrollable Body & Pinned Sticky Footer */}
        <Card className="flex-1 min-h-0 flex flex-col overflow-hidden shadow-sm border bg-card">
          {/* Header */}
          <div className="px-3.5 py-2 border-b shrink-0 flex items-center justify-between bg-muted/20">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Ringkasan Pembayaran
            </span>
            <kbd className="px-1.5 py-0.5 text-[9.5px] font-mono bg-background text-foreground rounded border font-semibold">
              F7: Bayar | F8: Pas
            </kbd>
          </div>

          {/* Middle Scrollable Section (Fits within 1360x768 without scroll, but scrolls if zoomed!) */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-3.5 space-y-2.5 custom-scrollbar">
            {/* Subtotal & Diskon Row */}
            <div className="space-y-1 pb-2 border-b text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Subtotal:</span>
                <span className="font-bold font-mono">Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>

              {/* Input / Toggle Diskon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-amber-500" /> Diskon:
                  </span>
                  {diskonNominal > 0 && (
                    <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {discountType === "persen" ? `${discountValue}%` : "Potongan"}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {isDiscountOpen ? (
                    <div className="flex items-center gap-1 animate-in fade-in">
                      <div className="flex bg-muted p-0.5 rounded border">
                        <button
                          type="button"
                          onClick={() => setDiscountType("persen")}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            discountType === "persen"
                              ? "bg-background text-foreground shadow-xs"
                              : "text-muted-foreground"
                          }`}
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType("nominal")}
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                            discountType === "nominal"
                              ? "bg-background text-foreground shadow-xs"
                              : "text-muted-foreground"
                          }`}
                        >
                          Rp
                        </button>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        value={discountValue || ""}
                        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                        placeholder={discountType === "persen" ? "10" : "5000"}
                        className="h-6.5 w-18 text-xs text-right font-mono"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDiscountValue(0);
                          setIsDiscountOpen(false);
                        }}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        title="Hapus Diskon"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDiscountOpen(true)}
                      className="h-5.5 px-1.5 text-[11px] font-semibold text-primary hover:underline gap-1"
                    >
                      {diskonNominal > 0
                        ? `-Rp ${diskonNominal.toLocaleString("id-ID")}`
                        : "+ Tambah Diskon"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Selector Metode Pembayaran */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Metode Bayar</span>
                <span className="text-[10px] text-muted-foreground normal-case font-normal">
                  [Alt+1..5]
                </span>
              </label>
              <div className="grid grid-cols-5 gap-1 bg-muted/70 p-1 rounded-xl border">
                {(["TUNAI", "QRIS", "TRANSFER", "DEBIT", "HUTANG"] as const).map((method) => {
                  const isActive = metodePembayaran === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setMetodePembayaran(method);
                        if (method !== "TUNAI" && method !== "HUTANG") {
                          setBayar(total);
                        } else if (method === "HUTANG") {
                          setBayar(0);
                        }
                      }}
                      className={`py-1.5 px-0.5 text-center rounded-lg font-bold text-[10.5px] transition-all flex flex-col items-center justify-center gap-1 ${
                        isActive
                          ? "bg-background text-primary shadow-xs border border-primary/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                      }`}
                    >
                      {method === "TUNAI" && <Wallet className="w-3.5 h-3.5" />}
                      {method === "QRIS" && <QrCode className="w-3.5 h-3.5" />}
                      {method === "TRANSFER" && <ArrowLeftRight className="w-3.5 h-3.5" />}
                      {method === "DEBIT" && <CreditCard className="w-3.5 h-3.5" />}
                      {method === "HUTANG" && <BookOpenCheck className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{method}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Pembayaran Sesuai Metode */}
            {metodePembayaran === "HUTANG" ? (
              <div className="space-y-3 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/20">
                <div className="flex items-center justify-between text-xs border-b pb-2">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                    <BookOpenCheck className="w-4 h-4 text-amber-500" /> Transaksi Kasbon / Hutang
                  </span>
                  <span className="text-[10px] text-muted-foreground">Member / Non-Member</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                    <span>Nama Pelanggan <span className="text-destructive">*</span></span>
                    {member && <span className="text-[10px] text-primary font-normal">Dari Member: {member.nama}</span>}
                  </label>
                  <Input
                    placeholder="Ketik nama peminjam (Contoh: Pak Budi RT 02)..."
                    value={member?.nama || kasbonNama}
                    onChange={(e) => {
                      setKasbonNama(e.target.value);
                      checkKasbonForCustomer(e.target.value);
                    }}
                    className="h-9 text-xs bg-background"
                    disabled={Boolean(member)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      No. HP / WA (Opsional):
                    </label>
                    <Input
                      placeholder="08xxxxxxxxxx"
                      value={member?.telepon || kasbonTelepon}
                      onChange={(e) => setKasbonTelepon(e.target.value)}
                      className="h-8 text-xs bg-background"
                      disabled={Boolean(member?.telepon)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Jatuh Tempo (Opsional):</span>
                      {kasbonJatuhTempo && (
                        <button
                          type="button"
                          onClick={() => setKasbonJatuhTempo("")}
                          className="text-[9.5px] text-destructive hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </label>
                    <Input
                      type="date"
                      value={kasbonJatuhTempo}
                      onChange={(e) => setKasbonJatuhTempo(e.target.value)}
                      className="h-8 text-xs bg-background font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Uang Muka / DP Dibayar (Opsional):</span>
                    <span className="text-[10px] text-muted-foreground">Rp 0 jika hutang penuh</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min="0"
                      max={total}
                      value={kasbonDp || ""}
                      onChange={(e) => setKasbonDp(Math.min(total, Math.max(0, Number(e.target.value))))}
                      placeholder="0"
                      className="pl-8 h-9 text-xs font-bold font-mono bg-background"
                    />
                  </div>
                </div>

                {/* Kalkulasi Kasbon Baru */}
                <div className="p-2.5 bg-background rounded-lg border space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tagihan Belanja:</span>
                    <span className="font-mono font-semibold">Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uang Muka (DP):</span>
                    <span className="font-mono font-semibold">Rp {kasbonDp.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1 text-amber-700 dark:text-amber-400">
                    <span>Tambah Saldo Hutang:</span>
                    <span className="font-mono">+Rp {Math.max(0, total - kasbonDp).toLocaleString("id-ID")}</span>
                  </div>
                  {customerKasbon && customerKasbon.saldoHutang > 0 && (
                    <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                      <span>Saldo Hutang Saat Ini:</span>
                      <span className="font-mono">Rp {customerKasbon.saldoHutang.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : metodePembayaran === "TUNAI" ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bayar Uang Tunai (Cash)
                  </label>
                  <span className="text-[10px] text-muted-foreground">Tekan [F7]</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-xs text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    ref={bayarInputRef}
                    type="number"
                    value={bayar || ""}
                    onChange={(e) => setBayar(Number(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                    className="pl-8 h-10 text-xl font-bold font-mono bg-background"
                    placeholder="0"
                  />
                </div>

                {/* Shortcut Uang Pas & Pecahan Responsif */}
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={setUangPas}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] h-8 px-1 shadow-2xs"
                    title="Bayar Uang Pas [F8]"
                  >
                    <Coins className="w-3.5 h-3.5 mr-1 shrink-0" /> Pas [F8]
                  </Button>
                  {[20000, 50000, 100000].map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setBayar(amt)}
                      className="text-[11px] font-semibold h-8 px-1 hover:bg-accent"
                    >
                      +{(amt / 1000).toLocaleString("id-ID")}k
                    </Button>
                  ))}
                </div>

                {/* Widget Potong Kembalian untuk Cicil Kasbon jika pelanggan memiliki hutang aktif */}
                {kembalianBruto > 0 && customerKasbon && customerKasbon.saldoHutang > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-200">
                        <input
                          type="checkbox"
                          checked={isPotongKembalian}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setIsPotongKembalian(checked);
                            if (checked) {
                              setPotongKembalianJumlah(
                                Math.min(kembalianBruto, customerKasbon.saldoHutang)
                              );
                            } else {
                              setPotongKembalianJumlah(0);
                            }
                          }}
                          className="rounded text-amber-600"
                        />
                        <span>Potong Kembalian untuk Kasbon</span>
                      </label>
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold font-mono">
                        Hutang: Rp {customerKasbon.saldoHutang.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {isPotongKembalian && (
                      <div className="space-y-1.5 pt-1 border-t border-amber-200 dark:border-amber-800/40 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-[11px]">Nominal Potong:</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={potongKembalianJumlah || ""}
                              onChange={(e) =>
                                setPotongKembalianJumlah(
                                  Math.min(
                                    kembalianBruto,
                                    customerKasbon.saldoHutang,
                                    Number(e.target.value)
                                  )
                                )
                              }
                              className="h-7 w-28 text-xs text-right font-mono bg-background"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setPotongKembalianJumlah(
                                  Math.min(kembalianBruto, customerKasbon.saldoHutang)
                                )
                              }
                              className="h-7 px-1.5 text-[10px] font-semibold"
                            >
                              Maks
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                          <span>Kembalian Belanja:</span>
                          <span className="font-mono">Rp {kembalianBruto.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                          <span>Potong Kasbon:</span>
                          <span className="font-mono">-Rp {effectivePotongKembalian.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-bold text-foreground">
                          <span>Kembalian Bersih:</span>
                          <span className="font-mono">Rp {kembali.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-amber-800 dark:text-amber-300 font-medium border-t border-dashed pt-1">
                          <span>Sisa Saldo Kasbon:</span>
                          <span className="font-bold font-mono">
                            Rp {Math.max(0, customerKasbon.saldoHutang - effectivePotongKembalian).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center bg-background px-3 py-1.5 rounded-lg border shadow-2xs mt-1.5">
                  <span className="text-muted-foreground font-medium text-xs">
                    {isPotongKembalian ? "Kembalian Bersih" : "Uang Kembalian"}
                  </span>
                  <span className="text-lg font-black text-emerald-600 font-mono">
                    Rp {kembali.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-background p-3 rounded-xl border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Total Tagihan:</span>
                  <span className="font-black text-sm text-foreground font-mono">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="space-y-1">
                  <label className="text-[10.5px] font-semibold text-muted-foreground">
                    No. Referensi / Trace ID / RRN (Opsional):
                  </label>
                  <Input
                    value={referensiPembayaran}
                    onChange={(e) => setReferensiPembayaran(e.target.value)}
                    placeholder={
                      metodePembayaran === "QRIS"
                        ? "Contoh: RRN 891238492"
                        : metodePembayaran === "TRANSFER"
                        ? "Contoh: BCA 1029 - Anto"
                        : "Contoh: Trace 40291"
                    }
                    className="h-8 text-xs font-mono"
                    onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                  />
                </div>
              </div>
            )}

            {/* Catatan Transaksi (Opsional) */}
            <div>
              <Input
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan transaksi (opsional)..."
                className="h-7 text-xs bg-background/60"
              />
            </div>
          </div>

          {/* Bottom Pinned Footer: Total Tagihan & PROSES BAYAR */}
          <div className="px-3.5 py-2.5 border-t shrink-0 bg-card/95 backdrop-blur z-20 space-y-2">
            <div className="flex justify-between items-baseline px-0.5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block leading-none">
                  Total Tagihan:
                </span>
                {diskonNominal > 0 && (
                  <span className="text-[10px] text-red-500 font-semibold block mt-0.5">
                    Hemat Rp {diskonNominal.toLocaleString("id-ID")}
                  </span>
                )}
              </div>
              <span className="text-2xl sm:text-3xl font-black text-primary font-mono tracking-tight">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>

            <Button
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-bold gap-2 shadow-md bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={
                cart.length === 0 ||
                (metodePembayaran === "TUNAI" && bayar < total) ||
                (metodePembayaran === "HUTANG" && !(member?.nama || kasbonNama).trim()) ||
                isSubmitting
              }
              onClick={handleCheckout}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSubmitting
                ? "Memproses..."
                : metodePembayaran === "HUTANG"
                ? "SIMPAN TRANSAKSI KASBON [F10]"
                : "PROSES BAYAR [F10]"}
            </Button>
          </div>
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

      {/* Dialog Antrean Transaksi Tersimpan (Recall Order) */}
      <Dialog open={isRecallOpen} onOpenChange={setIsRecallOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PauseCircle className="w-5 h-5 text-amber-500" /> Antrean Transaksi Tersimpan ({heldOrders.length})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daftar transaksi yang ditahan sementara. Klik tombol <strong>Buka</strong> untuk memulihkan transaksi ke kasir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto py-2">
            {heldOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Tidak ada transaksi yang sedang ditahan.
              </div>
            ) : (
              heldOrders.map((order) => {
                const itemCount = order.cart.reduce((a, c) => a + c.qty, 0);
                const orderTotal = order.cart.reduce((a, c) => a + c.harga * c.qty, 0);
                const timeStr = new Date(order.createdAt).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={order.id}
                    className="p-3 bg-muted/40 hover:bg-muted/70 border rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm truncate">{order.label}</p>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" /> {timeStr}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {itemCount} pcs ({order.cart.length} item) •{" "}
                        {order.member ? `Member: ${order.member.nama}` : "Pelanggan Umum"}
                      </p>
                      <p className="font-black text-primary text-xs font-mono mt-1">
                        Rp {orderTotal.toLocaleString("id-ID")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleRecallOrder(order)}
                        className="h-8 px-3 text-xs font-bold gap-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" /> Buka
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => handleDeleteHeldOrder(order.id, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Hapus Antrean"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Bayar Kasbon / Hutang Pelanggan */}
      <BayarKasbonDialog
        open={isBayarKasbonOpen}
        onOpenChange={setIsBayarKasbonOpen}
        onPaymentSuccess={(receipt) => {
          setReceiptData(receipt);
          setIsReceiptOpen(true);
        }}
      />

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
