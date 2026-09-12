# 🏪 My POS - Aplikasi Kasir & Manajemen Toko Retail Modern

Aplikasi Point of Sale (POS), Manajemen Inventori Barang, dan Pembukuan Keuangan Toko Retail Modern berbasis **Next.js 16 (App Router)**, **React 19**, **Prisma 7**, dan **PostgreSQL (Supabase Cloud / Local PostgreSQL)**. Dilengkapi dukungan **Progressive Web App (PWA)** sehingga dapat di-install layaknya aplikasi native pada Windows, Mac, Android, dan iOS.

---

## ✨ Fitur Unggulan

- ⚡ **Transaksi Kasir Cepat (Keyboard-First / Mouseless):** Dirancang untuk melayani antrean belanja dengan cepat menggunakan shortcut keyboard (`F1` - `F10`, `Alt+1..5`, `Enter`, `Esc`).
- 📦 **Modal Dialog Satuan & Kuantitas Otomatis:** Saat kasir scan barcode atau menekan Enter pada pencarian barang, muncul pop-up pilihan satuan (*Pcs*, *Pak*, *Dus*) dan input jumlah yang auto-fokus dan tervalidasi stok secara instan.
- 💳 **Multi-Metode Pembayaran:** Mendukung Tunai (Cash) dengan tombol pecahan uang pas, QRIS, Transfer Bank, Kartu Debit/EDC, dan Kasbon/Hutang.
- 📒 **Buku Kasbon & Saldo Hutang Pelanggan (Running Balance):** Saldo kasbon bertambah saat belanja kurang bayar dan berkurang saat dicicil/dilunasi. Mendukung potong uang kembalian untuk mencicil hutang dan cetak bukti tanda terima kasbon.
- 🖨️ **Cetak Struk Thermal Fleksibel:**
  - **Windows USB / Iframe Driver:** Cetak 1 lembar pas (0mm margin, pure `#000000`, tanpa URL header/footer browser).
  - **Direct Bluetooth ESC/POS:** Cetak langsung tanpa membuka dialog browser printer.
  - **Pengaturan Jarak Baris Struk:** Pilihan jarak baris belanja (*Rapat/Hemat*, *Sedang/Rekomendasi*, *Lega/Garis Pemisah*).
  - **Identitas Kasir:** Nama kasir yang bertugas otomatis tercantum di setiap struk transaksi.
- 📥 **Import Barang Masal (Excel / CSV):** Unduh template spreadsheet siap pakai dan upload ratusan produk sekaligus dengan opsi pembaruan data duplikat dan supplier opsional.
- 📷 **Scanner Barcode Kamera HP & Tablet:** Mendukung pemindaian barcode/QR fisik menggunakan kamera smartphone/tablet kasir secara responsif.
- 📈 **Laporan Laba Rugi Riil & Biaya Operasional:** Menghitung omset, modal pokok barang (HPP), penyesuaian stok opname, dan biaya operasional toko (Listrik, Gaji, Sewa, Kresek, dll) untuk menghasilkan laba bersih riil.
- 👥 **Hak Akses Pengguna (RBAC):** Pemisahan hak akses akun **Owner** (akses penuh laporan keuangan & master data) dan **Kasir** (operasional penjualan).
- 📲 **Installable PWA:** Dapat dipasang (*install*) ke Desktop Windows/Mac atau layar utama smartphone Android/iOS.

---

## 🔑 Akun & Kredensial Bawaan (Default)

Setelah proses database seeding dijalankan, sistem menyediakan 2 akun bawaan:

| Peran (Role) | Username | Password | Hak Akses |
|---|---|---|---|
| **Owner (Pemilik Toko)** | `owner` | `owner123` | Akses penuh: Laba Rugi, HPP/Modal, Biaya Operasional, Pengaturan, User, Void Transaksi. |
| **Kasir (Operator Toko)** | `kasir` | `kasir123` | Transaksi kasir, riwayat penjualan, pembayaran kasbon pelanggan (HPP & laba bersih disembunyikan). |

---

## 🪟 Panduan Instalasi di Komputer Windows (PC Kasir Toko)

Panduan ini digunakan untuk menjalankan server kasir di komputer/laptop toko (Windows 10 / 11) baik untuk pemakaian mandiri maupun melayani tablet/HP kasir di toko.

### 1. Prasyarat Software di Windows
1. Unduh dan pasang **Node.js LTS** (v20 atau v22) dari situs resmi: [https://nodejs.org](https://nodejs.org)
2. Unduh dan pasang **Git for Windows**: [https://git-scm.com](https://git-scm.com)
3. Buka **Command Prompt (CMD)** atau **PowerShell**, pastikan terpasang dengan baik:
   ```cmd
   node -v
   npm -v
   git --version
   ```

### 2. Clone Repository & Konfigurasi Environment
Buka Command Prompt, lalu arahkan ke folder yang Anda inginkan (misal `C:\`):
```cmd
cd C:\
git clone https://github.com/mulyadih98/my-pos.git
cd my-pos
copy .env.example .env
```
Buka file `.env` menggunakan Notepad:
```cmd
notepad .env
```
Isi konfigurasi database (Supabase Cloud PostgreSQL atau PostgreSQL lokal Windows) dan kunci otentikasi:
```ini
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&uselibpqcompat=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true"
AUTH_SECRET="buat-kunci-acak-rahasia-minimal-32-karakter-bebas-disini"
```
*Simpan file dan tutup Notepad.*

### 3. Instalasi Dependensi & Database
Jalankan perintah instalasi paket dependensi dan sinkronisasi skema tabel:
```cmd
npm install
npx prisma db push
npx prisma db seed
```

### 4. Build Production
Kompilasi kode aplikasi untuk mode produksi:
```cmd
npm run build
```

### 5. Uji Coba Menjalankan Aplikasi
```cmd
npm start
```
Buka browser di alamat: [http://localhost:3000](http://localhost:3000)

---

### 6. Menjalankan Otomatis di Background (Auto-Start saat Windows Menyala)

Agar kasir tidak perlu repot membuka Command Prompt setiap pagi, pilih salah satu metode berikut:

#### Pilihan A: Menggunakan NSSM (Windows Service Resmi - Rekomendasi Utama)
Aplikasi akan berjalan sebagai *Windows Service* di latar belakang (otomatis menyala saat komputer dinyalakan, bahkan sebelum login Windows, dan otomatis restart jika komputer mati listrik).

1. Unduh **NSSM (Non-Sucking Service Manager)** dari [https://nssm.cc/download](https://nssm.cc/download).
2. Ekstrak file zip, buka folder `win64`, dan salin `nssm.exe` ke folder `C:\Windows\System32` (atau ke folder `C:\my-pos`).
3. Buka **Command Prompt as Administrator**, lalu jalankan:
   ```cmd
   nssm install MyPosService "C:\Program Files\nodejs\npm.cmd" "start"
   nssm set MyPosService AppDirectory "C:\my-pos"
   nssm set MyPosService Description "Server Kasir My POS Next.js"
   nssm set MyPosService Start SERVICE_AUTO_START
   nssm start MyPosService
   ```
4. Selesai! Server kasir sekarang berjalan otomatis di latar belakang sebagai Windows Service 24/7.
   - Untuk mengecek status: Buka menu `services.msc` di Windows, cari service `MyPosService`.
   - Untuk menghentikan service: `nssm stop MyPosService`

#### Pilihan B: Menggunakan PM2 for Windows
1. Install PM2 dan utilitas startup Windows secara global:
   ```cmd
   npm install -g pm2 pm2-windows-startup
   pm2-startup install
   ```
2. Daftarkan aplikasi My POS ke PM2:
   ```cmd
   cd C:\my-pos
   pm2 start npm --name "my-pos" -- start
   pm2 save
   ```

#### Pilihan C: Menggunakan Script VBScript (Tanpa Install Aplikasi Eksternal)
1. Di dalam folder `C:\my-pos`, buat file `start-silent.vbs`:
   ```vbs
   Set WshShell = CreateObject("WScript.Shell")
   WshShell.Run "cmd /c cd /d C:\my-pos && npm start", 0, False
   Set WshShell = Nothing
   ```
2. Tekan tombol `Windows + R`, ketik `shell:startup`, lalu tekan **Enter**.
3. Buat Shortcut dari file `start-silent.vbs` dan masukkan ke folder Startup tersebut. Server akan otomatis jalan di latar belakang tanpa jendela hitam CMD setiap kali pengguna login.

---

### 7. Konfigurasi Reverse Proxy & SSL HTTPS di Windows (Seperti Linux)

Kamera scanner barcode pada HP/tablet kasir **membutuhkan koneksi HTTPS resmi** agar browser mengizinkan akses sensor kamera. Anda dapat menerapkan HTTPS di Windows dengan metode berikut:

#### Pilihan A: Menggunakan Caddy for Windows (Paling Mudah - Otomatis SSL Let's Encrypt)
Caddy adalah web server modern berupa 1 file `.exe` mandiri yang otomatis menerbitkan dan memperpanjang sertifikat SSL Let's Encrypt gratis tanpa konfigurasi yang rumit.

1. Unduh `caddy_windows_amd64.exe` dari [https://caddyserver.com/download](https://caddyserver.com/download) dan ubah namanya menjadi `caddy.exe`.
2. Letakkan `caddy.exe` di folder `C:\my-pos`.
3. Buat file bernama `Caddyfile` di folder `C:\my-pos` dengan isi:
   ```caddy
   pos.domainanda.com {
       reverse_proxy localhost:3000
   }
   ```
4. Pastikan domain Anda sudah diarahkan (DNS A Record) ke IP publik komputer Windows Anda, dan port `80` serta `443` sudah di-*port forward* di router modem internet toko Anda.
5. Jalankan Caddy sebagai Windows Service via NSSM:
   ```cmd
   nssm install CaddyService "C:\my-pos\caddy.exe" "run"
   nssm set CaddyService AppDirectory "C:\my-pos"
   nssm start CaddyService
   ```
   *Caddy akan otomatis membuatkan sertifikat SSL resmi HTTPS Let's Encrypt untuk domain Anda!*

#### Pilihan B: Menggunakan Nginx for Windows + win-acme (Setara Nginx + Certbot Linux)
1. Unduh Nginx for Windows dari [https://nginx.org/en/download.html](https://nginx.org/en/download.html) dan ekstrak ke `C:\nginx`.
2. Edit file konfigurasi `C:\nginx\conf\nginx.conf`:
   ```nginx
   server {
       listen 80;
       server_name pos.domainanda.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Unduh **win-acme** (klien Let's Encrypt resmi untuk Windows) dari [https://www.win-acme.com](https://www.win-acme.com).
4. Jalankan `wacs.exe` via Command Prompt Administrator, pilih domain Anda, dan win-acme akan otomatis membuat sertifikat SSL Let's Encrypt serta memperbarui file konfigurasi Nginx menjadi HTTPS port 443.

#### Pilihan C: SSL Jaringan Lokal Wi-Fi Toko (Offline Total Tanpa Domain via mkcert)
Jika toko Anda tidak memiliki domain publik dan ingin HP/tablet kasir mengakses kamera via Wi-Fi toko (misal `https://192.168.1.50:3000`):
1. Unduh **mkcert** dari GitHub: [https://github.com/FiloSottile/mkcert/releases](https://github.com/FiloSottile/mkcert/releases)
2. Jalankan perintah pembuatan sertifikat lokal:
   ```cmd
   mkcert -install
   mkcert localhost 127.0.0.1 192.168.1.50
   ```
   *Sertifikat SSL lokal terbit dan siap dipasang pada Caddy atau Nginx lokal toko Anda.*

#### Pilihan D: Menggunakan Cloudflare Tunnel (Solusi Praktis untuk IP Dinamis / CGNAT)
Jika modem internet toko Anda menggunakan IP dinamis atau CGNAT (seperti IndiHome/FirstMedia/seluler) yang tidak bisa buka port 80/443:
1. Unduh `cloudflared-windows-amd64.exe` dari Cloudflare dan simpan sebagai `cloudflared.exe`.
2. Jalankan tunnel instan:
   ```cmd
   cloudflared.exe tunnel --url http://localhost:3000
   ```
   *Salin URL HTTPS `https://...trycloudflare.com` yang muncul. URL tersebut sudah ber-SSL resmi dan dapat langsung dibuka di HP kasir.*

### 8. Membuka Port Windows Firewall (Untuk Akses HP di Jaringan Wi-Fi)
Agar perangkat lain di jaringan Wi-Fi toko bisa terhubung ke komputer server kasir:
Buka **PowerShell as Administrator**, jalankan:
```powershell
New-NetFirewallRule -DisplayName "My POS Server Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## 🐧 Panduan Instalasi di VPS Linux (Ubuntu / Debian Server Cloud)

Panduan ini digunakan untuk memasang My POS di VPS Cloud (DigitalOcean, AWS EC2, Linode, IDCloudHost, DomaiNesia, Biznet GIO, dll) agar sistem kasir dapat diakses online 24/7 dari berbagai cabang toko.

### 1. Persiapan Server VPS
Masuk ke VPS Anda via SSH:
```bash
ssh root@ip-vps-anda
```
Perbarui repository sistem dan instalasi dependensi esensial:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential nginx ufw
```

### 2. Pasang Node.js 20 LTS & PM2
Gunakan NodeSource repository untuk memasang Node.js 20 LTS:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```
Periksa versi yang terpasang:
```bash
node -v   # v20.x.x
npm -v    # v10.x.x
pm2 -v
```

### 3. Clone Repository Proyek
```bash
sudo mkdir -p /var/www/my-pos
sudo chown -R $USER:$USER /var/www/my-pos
git clone https://github.com/mulyadih98/my-pos.git /var/www/my-pos
cd /var/www/my-pos
```

### 4. Konfigurasi File Environment (`.env`)
Salin file template konfigurasi:
```bash
cp .env.example .env
nano .env
```
Sesuaikan parameter koneksi database Anda:
```ini
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require&uselibpqcompat=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true"
AUTH_SECRET="buat-kunci-acak-rahasia-minimal-32-karakter-bebas-disini"
```
*Tekan `Ctrl + O` lalu `Enter` untuk menyimpan, dan `Ctrl + X` untuk keluar dari nano.*

### 5. Install Paket Dependensi & Sinkronisasi Database
```bash
npm install
npx prisma db push
npx prisma db seed # (Mengisi data pengguna owner, kasir, dan master awal)
```

### 6. Build Aplikasi Production
```bash
npm run build
```

### 7. Jalankan Aplikasi dengan PM2 (Background Daemon 24/7)
```bash
pm2 start npm --name "my-pos" -- start
pm2 save
pm2 startup
```
*(Salin dan jalankan perintah `sudo env PATH=...` yang dimunculkan oleh `pm2 startup` agar service otomatis menyala saat server VPS restart).*

Periksa status aplikasi:
```bash
pm2 status
pm2 logs my-pos
```

### 8. Konfigurasi Reverse Proxy Nginx
Buat file konfigurasi server block Nginx:
```bash
sudo nano /etc/nginx/sites-available/my-pos
```
Masukkan konfigurasi berikut (ganti `pos.domainanda.com` dengan domain/subdomain Anda):
```nginx
server {
    listen 80;
    server_name pos.domainanda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Aktifkan konfigurasi Nginx dan uji sintaks:
```bash
sudo ln -s /etc/nginx/sites-available/my-pos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Pasang Sertifikat SSL Gratis Let's Encrypt (Certbot)
Pasang Certbot untuk mengaktifkan HTTPS gratis otomatis:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pos.domainanda.com
```
Pilih opsi pengalihan (*redirect*) seluruh traffic HTTP ke HTTPS.

### 10. Konfigurasi Firewall UFW
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Aplikasi kasir online Anda sekarang aktif dan dapat diakses dengan aman di `https://pos.domainanda.com`!

---

## 🔄 Pemeliharaan & Pembaruan Sistem (Update Proyek)

Jika ada pembaruan fitur atau perbaikan kode dari repositori GitHub:

### Di Komputer Windows:
```cmd
cd C:\my-pos
git pull origin main
npm install
npm run build
nssm restart MyPosService
```
*(Atau jika menggunakan PM2 di Windows: `pm2 restart my-pos`)*

### Di Server VPS Linux:
```bash
cd /var/www/my-pos
git pull origin main
npm install
npx prisma db push
npm run build
pm2 restart my-pos
```

---

## 🛠️ Perintah Berguna (Cheatsheet)

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan aplikasi dalam mode development lokal |
| `npm run build` | Melakukan kompilasi Next.js untuk production |
| `npm start` | Menjalankan server Next.js production di port 3000 |
| `npx prisma db push` | Menyinkronkan perubahan skema Prisma ke database |
| `npx prisma db seed` | Menjalankan database seeder default |
| `npx prisma studio` | Membuka GUI browser database inspector |
| `pm2 logs my-pos` | Memantau log aplikasi secara real-time |
| `pm2 restart my-pos` | Merestart service server kasir |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk kebutuhan operasional kasir ritel toko mandiri dan dapat digunakan serta dikembangkan sesuai lisensi proyek.
