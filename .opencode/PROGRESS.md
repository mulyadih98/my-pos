# PROGRESS & CONTEXT CHECKPOINT

> **Petunjuk AI:** Berkas ini adalah memori permanen proyek untuk mencegah kehilangan konteks saat terjadi rate limit, token limit, atau sesi terputus. Baca berkas ini bersamaan dengan `git status` dan `git log -3` saat memulai atau melanjutkan sesi.

---

## 1. Ringkasan Status Proyek Saat Ini
- **Aplikasi:** My POS (Point of Sale & Manajemen Inventori Toko)
- **Tech Stack:** Next.js 16.2.4 (App Router), React 19.2.4, Prisma 7.8.0, MariaDB 10.11 (database `my_pos`).
- **Database Status:** Aktif & sinkron (13 tabel).
- **Server Port:** 3000 (`npm run dev`).
- **Git Remote:** `git@github.com:mulyadih98/my-pos.git` (branch `main`).

---

## 2. Fitur yang Sudah Selesai & Stabil
- [x] **Setup Database MariaDB:** Instalasi MariaDB lokal, database `my_pos`, dan seeder default.
- [x] **Skema Prisma:** 13 model entitas lengkap dan tersinkronisasi (`prisma/schema.prisma`).
- [x] **Cetak Struk Thermal:** 
  - Isolated Iframe (1 lembar pas, margin 0, tanpa header/footer URL browser, pure black `#000000`).
  - Direct Web Bluetooth ESC/POS (tanpa dialog print).
  - Smart auto-fallback (Prioritas 1: Direct, Prioritas 2: Driver Windows).
- [x] **Pengaturan Toko & Printer (`/dashboard/pengaturan`):**
  - Identitas toko (Nama, Alamat, Telp, Footer).
  - Kertas 58mm / 80mm.
  - Penyimpanan 2 lapis: LocalStorage per-device + Database MariaDB default.
  - Tombol Tes Print & Cek Bluetooth.
  - Tipografi & Tampilan Layar Kasir UI: Ukuran font (sm/md/lg/xl), ketebalan (normal/medium/bold), dan jenis huruf (sans/system/mono/rounded) per-device via LocalStorage.
- [x] **Modal Struk Kasir Bersih:**
  - Hanya 2 tombol utama: `[Cetak Struk]` (Enter) dan `[Selesai Tanpa Cetak]` (Esc).
  - Tombol cetak ulang di Riwayat Transaksi (`/dashboard/riwayat`).
- [x] **Universal ID Generator:** Pengganti `crypto.randomUUID()` aman untuk HTTP IP publik.
- [x] **Desain Responsif Multi-Device:**
  - Mobile/Tablet (< 1024px): Tab Switcher (`[Produk & Scan]` vs `[Keranjang & Bayar]`) + Floating Bottom Checkout Bar.
  - Touch-friendly tombol kuantitas (36px+) dan pecahan uang cepat (40px).
  - DataTable responsif dengan horizontal scroll (`overflow-x-auto`) dan toolbar/pagination adaptif.
  - Master Barang kolom adaptif.
- [x] **Pencarian Kasir:** Filter kategori di bawah search barang telah dihapus sesuai permintaan.
- [x] **Kamera Scanner Barcode & QR (Khusus Mobile/Tablet < 1024px):** Tombol scanner kamera otomatis aktif di HP dan tablet di samping search bar, mendukung pembacaan 1D barcode & 2D QR dengan mode sekali scan atau multi-scan beruntun.
- [x] **Laporan Laba Rugi (`/dashboard/laba-rugi`):** Analisis komprehensif omset, HPP/modal, laba kotor, kerugian stok opname, laba bersih, grafik tren harian, rincian laba per produk, ekspor CSV, dan print laporan.
- [x] **Alur Git 5 Langkah Baku:** Skill `git-feature-workflow` dan instruksi permanen di `AGENTS.md`.

---

## 3. Format Catatan untuk Tugas Sedang Berjalan (Active Task)
*Bila Anda sedang mengerjakan fitur/fixing baru, catat progressnya di bawah ini sebelum token habis:*

```markdown
### Tugas Aktif: [Nama Tugas]
- Branch: [feat/... atau fix/...]
- Status: [In Progress / Testing / Ready to Merge]
- Langkah Selesai:
  - [x] Langkah A
  - [x] Langkah B
- Langkah Berikutnya:
  - [ ] Langkah C (Titik kelanjutan)
  - [ ] Verifikasi npm run build
  - [ ] Commit, Merge ke main, Push ke GitHub
```
