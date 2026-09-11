---
name: git-feature-workflow
description: Gunakan SELALU setiap kali menambah fitur baru, mengubah kode, atau memperbaiki bug pada proyek ini. Menginstruksikan alur kerja wajib 5 langkah: 1. Create branch, 2. Build fitur/fixing, 3. Commit, 4. Merge ke main, 5. Push ke GitHub.
---

# Git Feature & Fixing Workflow SOP

Setiap kali pengguna meminta untuk **menambahkan fitur baru** atau **memperbaiki (fixing) bug/masalah**, Anda **WAJIB** menjalankan 5 tahapan kerja terstruktur berikut tanpa melewatkan satupun:

---

## 5 Langkah Baku:

### 1. Buat Branch Baru (Create Branch)
- Pastikan berada di branch `main` dan sinkron:
  ```bash
  git checkout main
  ```
- Buat branch baru dengan penamaan yang spesifik:
  - Untuk fitur baru: `feat/<nama-fitur-singkat>` (contoh: `feat/cetak-struk-thermal`, `feat/export-excel`)
  - Untuk perbaikan bug: `fix/<nama-bug-singkat>` (contoh: `fix/uuid-generator`, `fix/login-error`)
  ```bash
  git checkout -b <tipe>/<nama-singkat>
  ```

### 2. Implementasi & Verifikasi Build (Build & Self-Verification)
- Buat atau modifikasi kode sesuai kebutuhan task.
- **Wajib Verifikasi:** Jalankan pengujian build Next.js sebelum commit:
  ```bash
  npm run build
  ```
- Pastikan tidak ada error kompilasi, tipe data TypeScript, ataupun linting.

### 3. Simpan Perubahan (Git Commit)
- Periksa berkas yang berubah (`git status`).
- Stage berkas yang relevan (`git add .` atau tentukan file spesifik).
- Buat commit dengan pesan jelas berstandar Conventional Commits:
  - `feat: <penjelasan singkat penambahan fitur>`
  - `fix: <penjelasan singkat perbaikan bug>`
  ```bash
  git commit -m "<tipe>: <deskripsi pesan>"
  ```

### 4. Gabungkan ke Branch Utama (Merge to Main)
- Pindah kembali ke branch utama:
  ```bash
  git checkout main
  ```
- Gabungkan branch fitur/fixing:
  ```bash
  git merge <tipe>/<nama-singkat>
  ```
- Hapus branch kerja sementara agar repositori tetap rapi:
  ```bash
  git branch -d <tipe>/<nama-singkat>
  ```

### 5. Unggah ke Repositori GitHub (Push to GitHub)
- Dorong perubahan branch `main` ke remote repository:
  ```bash
  git push origin main
  ```

---

## Aturan Tambahan:
- **Dilarang langsung commit di `main`** untuk perubahan fitur atau perbaikan kode. Selalu gunakan alur branch ➔ merge.
- Jangan melakukan force push (`git push -f`).
- Pastikan berkas rahasia (`.env`) dan berkas log runtime (`dev.log`) tidak pernah ter-commit.
