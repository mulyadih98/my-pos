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
- [x] **Import Barang Masal via Excel / CSV & Supplier Opsional:**
  - **Supplier Fleksibel:** Kolom `supplierId` pada model `Barang` dibuat nullable (`String?`), memungkinkan produk disimpan tanpa supplier (tampil strip `-`).
  - **Download Template Spreadsheet:** Berkas template Excel (`public/template_import_barang.xlsx`) dan CSV (`public/template_import_barang.csv`) berisi 10 contoh variasi produk ritel nyata siap unduh langsung dari modal impor maupun URL web publik.
  - **Pratinjau Live & Validasi:** Parsing file `.xlsx`/`.csv` via library `xlsx`, validasi nama & harga, penanganan auto-barcode unik jika kosong, dan opsi duplikat (update stok/harga vs lewati).
  - **Batch Chunking Server Action:** Fungsi `importBarangBatch` memproses 20 barang/batch dengan auto-register Kategori & Satuan baru tanpa membebani connection pooler Supabase.
  - **Layout Modal Footer:** Perbaikan posisi tombol aksi Import dan Batal pada modal impor barang agar tidak terpotong/tenggelam pada layar dengan container footer `shrink-0` dan `min-h-0` yang presisi.
- [x] **Dukungan Progressive Web App (PWA) & Branding Aplikasi:**
  - **Identitas & Judul Resmi:** Mengganti judul default *"Create Next App"* menjadi *"My POS - Aplikasi Kasir & Manajemen Toko"* dengan title template dinamis `%s | My POS`, deskripsi sistem kasir modern, dan theme-color Dark Charcoal (`#09090b`).
  - **Logo Storefront "MY POS - TOKO SERBA ADA":** Desain logo etalase toko ritel kustom & orisinal (kanopi geometris modern 3-panel, pintu kaca lengkung dengan tas belanja luxury, jendela etalase dengan terminal kasir POS digital, tipografi tebal MY POS, dan kapsul pill badge TOKO SERBA ADA dalam warna Primary Dark Charcoal `#09090b`).
  - **App Icons Resolusi Tinggi:** Generate ikon PNG profesional di `public/icons/` (192x192, 512x512, maskable 512x512 untuk Android, dan apple-touch-icon 180x180 untuk iOS).
  - **Web App Manifest & Service Worker:** Konfigurasi `src/app/manifest.ts`, `public/manifest.json`, dan `public/sw.js` (mode standalone, offline caching) memenuhi standar W3C & Google Chrome PWA.
  - **Integrasi Komponen Brand:** Komponen `AppLogo` vektor adaptif (otomatis menyesuaikan tema terang/gelap) terintegrasi pada Header Sidebar dan Halaman Login, serta tombol PWA dan dialog impor barang.
- [x] **Optimasi Layout Kasir Layar Laptop 1360x768 (Tombol Bayar Selalu Terlihat):**
  - **Zero Scroll di 1360x768:** Mengompresi ruang vertikal pada `TransaksiPage` dan menyatukan kartu Member menjadi bar pencarian kompak sehingga seluruh panel pembayaran muat dalam 1 layar utuh tanpa scroll.
  - **Sticky Bottom Action Footer:** Total Tagihan dan tombol `[PROSES BAYAR [F10]]` diposisikan sebagai pinned footer (`shrink-0` di dasar kartu) sehingga tidak akan pernah terpotong atau tenggelam di layar mana pun, bahkan jika browser di-zoom hingga 125%-150%.
- [x] **Pengaturan & Peningkatan Jarak Baris Item Struk (Receipt Line Spacing):**
  - **Jarak Standar Lebih Lega & Mudah Dibaca:** Mengubah default margin antar item dari 4px menjadi 7px dengan padding dan line-height proporsional sehingga struk belanja tidak lagi berdempetan.
  - **Opsi Pengaturan 3 Tingkat:** Pilihan spasi `compact` (Rapat/Hemat Kertas), `normal` (Sedang/Rekomendasi - berjarak bersih), dan `loose` (Lega - berjarak jauh dengan garis pemisah putus-putus) yang tersinkronisasi di Database Supabase & LocalStorage per perangkat.
  - **Dukungan Multi-Engine:** Diterapkan pada thermal printer iframe, Direct ESC/POS Bluetooth, modal dialog pratinjau struk kasir (`receipt-modal.tsx`), serta live preview di halaman `/dashboard/pengaturan`.
- [x] **Identitas Nama Kasir pada Struk Transaksi & Kasbon:**
  - **Pencatatan Otomatis:** Sistem mendeteksi user aktif yang login (Owner atau Kasir) dan otomatis mencantumkan nama kasir pada transaksi baru serta pembayaran kasbon.
  - **Tampilan Struk Multi-Media:** Baris `Kasir: [Nama Kasir]` tercetak jelas pada thermal iframe printer, Direct ESC/POS Bluetooth (`Ksr:`), cetak ulang struk di Riwayat Transaksi, dan modal dialog struk belanja.
- [x] **Validasi Stok Real-Time & Penanganan Error Transaksi:**
  - **Penanganan Error Server Action Bersih:** Server action `createTransaksi` menangani pembatalan transaksi dengan respons aman `{ success: false, error }` (bukan unhandled throw), mencegah error HTTP 500 pada Vercel.
  - **Validasi Stok Sisi Klien:** Pengecekan sisa stok fisik secara presisi pada `addToCart`, tombol step `updateQty (+/-)`, dan input angka langsung `setQtyDirect` dengan notifikasi peringatan sebelum transaksi dikirim ke server.
  - **Sinkronisasi Stok Kasir Instan:** Pengurangan stok lokal seketika pada state keranjang kasir setelah transaksi sukses tanpa perlu refresh halaman manual.
  - **Optimasi Form Kasbon & Pinned Action Button:** Membuang dead padding dan gap bawaan Card, menyesuaikan viewport height dinamis `100dvh`, memperjelas ringkasan Sisa Hutang Kasbon vs DP pada footer, dan memberikan feedback interaktif jika nama pelanggan kasbon belum diisi.
- [x] **Dialog Pilihan Satuan & Input Kuantitas (Keyboard-First POS Item Modal):**
  - **Modal Pemilihan Unit & Qty Sebelum Masuk Keranjang:** Komponen `ItemQuantityDialog` (`src/components/pos/item-quantity-dialog.tsx`) aktif saat kasir menekan `Enter` di pencarian barang/barcode atau klik produk.
  - **100% Mouseless & Ergonomis:** Pilihan satuan via shortcut `[Alt+1..9]` atau panah `[←/→]`, input qty auto-focus & auto-select (cukup ketik angka lalu tekan `Enter`), tombol step `↑/↓` dan `+/-`, quick chips `[+1] [+2] [+5] [+10] [Maks]`.
  - **Validasi Stok Real-Time & Subtotal Live:** Perhitungan subtotal dan konversi satuan fisik otomatis memeriksa stok sisa di database dan barang yang sudah ada di keranjang.
  - **Opsi Pengaturan:** Pengaturan saklar `confirmItemQtyDialog` di `/dashboard/pengaturan` untuk mengaktifkan/menonaktifkan dialog sesuai preferensi operasional toko.
- [x] **Antarmuka Tabbed Settings Bersih & Rapi (`/dashboard/pengaturan`):**
  - **Organisasi 4 Tab Terstruktur:** Mengubah layout panjang scroll vertikal menjadi 4 tab tematik (`Identitas Toko`, `Printer & Struk`, `Alur Kasir (POS)`, `Tampilan Layar (UI)`).
  - **Fix Overflow & Wadah Tab:** Memperbaiki styling container `TabsList` dan `TabsTrigger` agar tombol tab tidak terkunci pada tinggi sempit 32px (`h-8`), membungkus seluruh tombol rapi 100% di dalam box container baik saat 1 baris di desktop maupun 2 baris di layar kecil.
  - **Pratinjau Kontekstual Dinamis:** Tab Toko & Printer menyertakan Live Preview Struk Thermal, Tab Kasir menampilkan simulasi modal kuantitas & panduan shortcut, dan Tab Tampilan menampilkan simulasi kartu produk real-time.
  - **Aksi Terpusat:** Tombol simpan per perangkat, default database, dan reset ditempatkan pada bar bawah terpadu yang selalu mudah dijangkau.
- [x] **Dokumentasi Lengkap Instalasi Windows & VPS Linux (`README.md`):**
  - **Panduan Windows:** Langkah instalasi PC kasir, konfigurasi auto-start service latar belakang 24/7 (NSSM Windows Service resmi, PM2 Windows, dan Silent VBScript), serta implementasi SSL HTTPS lengkap (Caddy otomatis Let's Encrypt, Nginx for Windows + win-acme, SSL lokal offline via mkcert, dan Cloudflare Tunnel).
  - **Panduan VPS Linux:** Setup Ubuntu/Debian, Node.js 20 LTS, daemon PM2, Nginx reverse proxy port 3000, Let's Encrypt Certbot, UFW firewall, dan instruksi update maintenance.
- [x] **Alur Git 5 Langkah Baku:** Skill `git-feature-workflow` dan instruksi permanen di `AGENTS.md`.
- [x] **Optimasi Impor Massal Excel & Penanganan Barcode (Bebas Timeout hingga 4.000+ Baris):**
  - **Client-Side Sequential Chunking:** Membagi ribuan baris data menjadi batch 100 produk/request, memanggil Server Action secara berantai sehingga tidak pernah menyentuh timeout HTTP/Next.js.
  - **Bulk Database Operations (Multi-Row SQL):** Mengganti eksekusi individual lambat dengan `createMany` untuk Barang dan VarianBarang, serta pemeriksaan barcode yang sudah ada dalam 1 query tunggal (`kode: { in: batchCodes }`). Peningkatan kecepatan query dari ~50 detik menjadi ~1,5 detik per 100 produk (>30x lebih cepat).
  - **Proteksi & Deteksi Barcode Kembar:** Deteksi duplikasi barcode internal file secara otomatis, penanda badge "Kembar di File", proteksi `skipDuplicates: true` pada tingkat database PostgreSQL, serta pembuatan auto-barcode dengan sequence counter unik untuk menjamin 0% bentrok.
  - **Real-Time Progress UI & Kontrol Impor:** Kartu progress visual dengan progress bar dinamis, metrik langsung (+Baru, Diperbarui, Dilewati, Gagal), dan tombol pembatalan aman (*Hentikan Impor*).
  - **Paginasi & Filter Pratinjau Cepat:** Tab filter (*Semua*, *Siap Diimpor*, *Error*) dan paginasi 50 produk/halaman sehingga berkas besar berisi 4.000+ baris dapat dibuka seketika tanpa lag pada browser.
- [x] **Proteksi & Penanganan Aman Hapus Master Satuan, Kategori & Supplier:**
  - **Validasi Relasi Aktif Produk:** Mencegah pelanggaran Foreign Key Constraint PostgreSQL saat satuan, kategori, atau supplier dihapus. Sistem mendeteksi barang terkait dan menolak penghapusan dengan notifikasi peringatan jelas.
  - **Penanganan Error Sisi Klien Modern:** Mengganti submit form langsung dengan `useTransition` dan `try...catch` pada `DeleteUnitDialog` dan `DeleteSupplierDialog`, menampilkan notifikasi toast feedback interaktif tanpa pernah memicu unhandled server exception atau crash halaman web.
  - **Pelepasan Relasi Aman (Unlink):** Otomatis melepaskan relasi kategori dan supplier pada barang saat dihapus sehingga barang tidak menjadi yatim atau rusak.
- [x] **Autocomplete & Pencarian Cepat Kasbon Non-Member (Bebas Typo):**
  - **Dropdown Saran Database Real-Time:** Saat kasir memilih metode HUTANG atau mengetik di kolom nama pelanggan, sistem secara otomatis menampilkan daftar pelanggan kasbon terdaftar di database lengkap dengan nama, telepon, dan status saldo hutang saat ini.
  - **Pencarian Case-Insensitive:** Menggunakan mode pencarian PostgreSQL `insensitive` sehingga penulisan huruf besar/kecil (misal: "budi" vs "Budi") tetap menemukan data yang sama.
  - **Pencegahan Akun Ganda (Direct ID Linking):** Pemilihan pelanggan dari daftar saran langsung mengikat transaksi ke ID Buku Kasbon pelanggan yang tepat (`kasbonId`), serta menyediakan opsi tombol `+ Daftarkan sebagai Pelanggan Baru` jika nama yang diketik memang pelanggan baru.
  - **Status Terhubung Visual:** Kartu status hijau dengan tombol *Ganti Pelanggan* yang memudahkan kasir memastikan transaksi kasbon tercatat ke pelanggan yang tepat.

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
