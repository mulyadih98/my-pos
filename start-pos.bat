@echo off
title My POS Application Server
color 0A

echo ===================================================
echo           MEMULAI APLIKASI MY POS SERVER
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Cek dan Jalankan Database MySQL (XAMPP) jika belum aktif
echo [1/3] Memeriksa koneksi database MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       [OK] Database MySQL sudah aktif.
) else (
    echo       Menjalankan MySQL XAMPP di background...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >nul
        echo       [OK] Database MySQL berhasil dijalankan.
    ) else (
        echo       [PERINGATAN] Pastikan database MySQL aktif.
    )
)

echo.
echo [2/3] Membuka browser ke POS Dashboard...
start http://localhost:3000/dashboard

echo.
echo [3/3] Menjalankan Next.js Dev Server...
echo ===================================================
echo Server aktif di: http://localhost:3000
echo Tekan CTRL + C di jendela ini untuk menghentikan server.
echo ===================================================
echo.

npm run dev
pause
