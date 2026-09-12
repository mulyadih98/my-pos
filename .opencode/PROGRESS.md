# PROGRESS & CONTEXT CHECKPOINT

> **Petunjuk AI:** Berkas ini adalah memori permanen proyek untuk mencegah kehilangan konteks saat terjadi rate limit, token limit, atau sesi terputus. Baca berkas ini bersamaan dengan `git status` dan `git log -3` saat memulai atau melanjutkan sesi.

---

## 1. Ringkasan Status Proyek Saat Ini
- **Aplikasi:** My POS (Point of Sale & Manajemen Inventori Toko)
- **Tech Stack:** Next.js 16.2.4 (App Router), React 19.2.4, Prisma 7.8.0, PostgreSQL (Supabase Cloud via IPv4 Pooler & `@prisma/adapter-pg`).
- **Database Status:** Aktif, sinkron & terhubung ke Supabase Cloud (18 tabel).
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
- [x] **Kamera Scanner Barcode & QR (Khusus Mobile/Tablet < 1024px):** Tombol scanner kamera otomatis aktif di HP dan tablet di samping search bar kasir serta form Tambah/Edit Barang (`BarangForm`), menggunakan komponen modal `CameraScannerDialog` terpadu dengan feedback suara.
- [x] **HTTPS SSL via Cloudflare Tunnel:** Paket `cloudflared` terpasang di sistem, menyediakan tunnel HTTPS resmi (URL trycloudflare) agar kamera HP/tablet dapat diakses tanpa hambatan security context browser.
- [x] **Laporan Laba Rugi (`/dashboard/laba-rugi`):** Analisis komprehensif omset, HPP/modal, laba kotor, kerugian stok opname, laba bersih, grafik tren harian, rincian laba per produk, ekspor CSV, dan print laporan.
- [x] **Fitur Prioritas Tinggi POS Selesai & Stabil:**
  - **Multi Metode Pembayaran:** Pilihan Tunai, QRIS, Transfer Bank, dan Kartu Debit/EDC dengan shortcut keyboard [Alt+1..4] dan input no. referensi pembayaran.
  - **Tahan Transaksi (Hold & Recall Order):** Parkir antrean belanja sementara ke LocalStorage dengan nama/label antrean dan pemulihan cepat [Alt+H / Alt+R] tanpa kehilangan keranjang.
  - **Diskon Transaksi (Global Discount):** Potongan transaksi fleksibel dalam format Persen (%) maupun Nominal Rupiah (Rp).
  - **Filter Tanggal & Status di Riwayat (`/dashboard/riwayat`):** Filter preset Hari Ini, Kemarin, 7 Hari, Bulan Ini, Semua, dan Kustom Tanggal, ditambah filter metode bayar dan status lunas/void, serta kartu metrik omset ringkas.
  - **Pembatalan / Retur Transaksi (Void / Refund):** Pembatalan transaksi terverifikasi dengan alasan pembatalan dan otomatis mengembalikan stok barang ke toko serta mengecualikan nilai omset dari laporan laba rugi.
  - **Struk Thermal Multi-Metode & Void:** Cetak struk iframe dan ESC/POS direct Bluetooth otomatis menampilkan metode bayar, diskon, dan tanda void bila dibatalkan.
- [x] **Sistem Saldo Kasbon / Hutang Akumulatif Pelanggan (Member & Non-Member):**
  - **Running Balance Akumulatif:** Saldo kasbon bertambah saat belanja kurang bayar dan berkurang saat dicicil/dilunasi (tidak terikat per-invoice).
  - **Metode Pembayaran [HUTANG]:** Mendukung pelanggan Non-Member dan Member, input DP, dan batas jatuh tempo opsional.
  - **Potong Kembalian untuk Kasbon:** Otomasi pemotongan uang kembalian belanja tunai baru untuk mencicil saldo kasbon lama dengan kalkulasi kembalian bersih.
  - **Bayar Kasbon Langsung di Kasir:** Modal dialog cepat [Alt+B] untuk pembayaran cicilan tunai maupun non-tunai (QRIS, Transfer Bank, Debit) lengkap dengan no. referensi.
  - **Buku Kasbon Toko (`/dashboard/kasbon`):** Rekapitulasi piutang aktif, kartu kasbon buku besar (ledger rinci), dan link pengingat tagihan WhatsApp satu-klik.
  - **Struk Thermal Kasbon:** Cetak bukti belanja kasbon, potong kembalian, dan tanda terima cicilan kasbon instan.
- [x] **Autentikasi & Hak Akses (RBAC: Owner vs Kasir):**
  - **Session Cookie Aman (JWT/HMAC):** Menggunakan `jose` dan HTTP-Only Secure Cookie `mypos_session` berlaku 7 hari.
  - **Halaman Login Modern (`/login`):** Validasi kredensial, toggle lihat password, dan tombol pengisian cepat akun default (Owner: `owner`/`owner123` & Kasir: `kasir`/`kasir123`).
  - **Next.js Middleware:** Proteksi otomatis rute `/dashboard/*` dari akses publik, redirect `/login`, dan pembatasan rute Owner dari Kasir.
  - **Manajemen Pengguna (`/dashboard/user`):** Owner dapat menambah kasir baru, mengubah hak akses, reset password, dan menonaktifkan akun.
  - **Sidebar & NavUser Adaptif:** Menampilkan nama pengguna, role badge, tombol logout aktif, dan menyaring menu secara otomatis (Kasir hanya melihat menu operasional).
  - **Proteksi Khusus:** Tombol Void Transaksi di Riwayat dikunci khusus Owner (Opsi 1). Kolom Harga Modal (HPP) dan tombol Hapus Barang disembunyikan untuk Kasir.
- [x] **Pencatatan Biaya Operasional Toko (`/dashboard/operasional`):**
  - **Manajemen Pengeluaran Toko:** Input pengeluaran operasional (Listrik/Air, Gaji, Sewa, Perlengkapan/Kresek, Transport, Pemeliharaan, dll) metode tunai/transfer.
  - **Integrasi Penuh ke Laba Rugi (`/dashboard/laba-rugi`):** Pengeluaran operasional otomatis memotong laba kotor untuk menghitung Laba Bersih Riil Toko (*Net Profit*), dilengkapi kartu ringkasan KPI dan tabel breakdown beban usaha.
- [x] **Migrasi Database ke Supabase Cloud PostgreSQL:**
  - **Provider & Adapter Modern:** Migrasi skema Prisma ke `postgresql` dengan `@prisma/adapter-pg` dan connection pooler.
  - **Dukungan Pooler IPv4:** Konfigurasi koneksi pooler Supabase (`aws-1-ap-southeast-2.pooler.supabase.com`) port 6543 (transaction mode via pgbouncer) dan port 5432 (session mode DDL/seeding) untuk mengatasi kendala IPv6 direct unreachable pada server lokal.
  - **Seeding & Sinkronisasi:** 18 tabel model dan data master default (user owner/kasir, satuan, kategori, supplier, member, barang) terverifikasi aktif di Supabase.
- [x] **Fix Vercel Deployment & NPM Registry Lockfile:**
  - Pembersihan URL mirror internal Tencent Cloud (`mirrors.tencentyun.com`) pada `package-lock.json` menjadi URL resmi publik `registry.npmjs.org`.
  - Penambahan file `.npmrc` dengan `registry=https://registry.npmjs.org/` agar instalasi dependensi di cloud CI/CD seperti Vercel berjalan lancar tanpa error ENETUNREACH/ENOTFOUND.
- [x] **Fix Penanganan Hapus Barang & Relasi Promo:**
  - Pembersihan relasi promo otomatis (`onDelete: Cascade` pada model Promo) dan pengecekan spesifik relasi transaksi/pembelian/opname sebelum menghapus barang agar tidak memicu pelanggaran Foreign Key.
  - Penanganan error aman dengan notifikasi toast (`sonner`) pada `DeleteBarangDialog` untuk mencegah crash Unhandled Server Error Boundary.
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
