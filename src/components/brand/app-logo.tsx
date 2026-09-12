import React from "react";

interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Logo Resmi Storefront My POS - Toko Serba Ada
 * Desain Modern Minimalist Storefront & Terminal Kasir POS Digital
 * Menggunakan currentColor sehingga adaptif otomatis terhadap tema Terang / Gelap
 */
export function AppLogo({ className = "size-6", size, ...props }: AppLogoProps) {
  return (
    <svg
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 1. Sleek Roof Bar */}
      <rect x="3.5" y="2" width="17" height="1.2" rx="0.6" fill="currentColor" />

      {/* 2. Modern 3-Panel Geometric Canopy */}
      <path
        d="M3.8 3.5 L4.5 8 C4.7 8.6 5.3 9 6 9 C6.7 9 7.3 8.6 7.5 8 L7.8 3.5 Z"
        fill="currentColor"
      />
      <path
        d="M7.8 3.5 L8.1 8.2 C8.3 8.8 9.1 9.2 9.8 9.2 H14.2 C14.9 9.2 15.7 8.8 15.9 8.2 L16.2 3.5 Z"
        fill="currentColor"
      />
      <path
        d="M16.2 3.5 L16.5 8 C16.7 8.6 17.3 9 18 9 C18.7 9 19.3 8.6 19.5 8 L20.2 3.5 Z"
        fill="currentColor"
      />

      {/* Canopy Gap Line Accents */}
      <line x1="7.8" y1="3.5" x2="7.8" y2="8.5" stroke="var(--background, #fff)" strokeWidth="0.4" strokeLinecap="round" />
      <line x1="16.2" y1="3.5" x2="16.2" y2="8.5" stroke="var(--background, #fff)" strokeWidth="0.4" strokeLinecap="round" />

      {/* 3. Outer Walls & Base */}
      <path
        d="M4.5 9 V18 H3.2 C2.8 18 2.5 18.3 2.5 18.7 C2.5 19.1 2.8 19.4 3.2 19.4 H20.8 C21.2 19.4 21.5 19.1 21.5 18.7 C21.5 18.3 21.2 18 20.8 18 H19.5 V9"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 4. Left Arch Doorway */}
      <path
        d="M5.5 18 V12 C5.5 10.9 6.4 10 7.5 10 H8.5 C9.6 10 10.5 10.9 10.5 12 V18"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Shopping Bag inside Doorway */}
      <g transform="translate(6.6, 12.8) scale(0.14)">
        <rect x="0" y="5" width="20" height="22" rx="4" stroke="currentColor" strokeWidth="2.4" fill="none" />
        <path d="M5 5 V2 C5 0.9 5.9 0 7 0 H13 C14.1 0 15 0.9 15 2 V5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="15" r="2.5" fill="currentColor" />
      </g>

      {/* 5. Right Window Display with POS Register Screen */}
      <rect x="12" y="10" width="6.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="0.8" fill="none" />

      {/* Mini POS Terminal Screen */}
      <rect x="13.2" y="10.8" width="4" height="2.5" rx="0.4" fill="currentColor" />
      <path d="M14.6 13.3 L14.2 14.1 H16.2 L15.8 13.3" fill="currentColor" />

      {/* Lower Window Shelf */}
      <rect x="12" y="15.5" width="6.5" height="1.8" rx="0.4" stroke="currentColor" strokeWidth="0.8" fill="none" />

      {/* 6. Subtle Pill Badge Line at Bottom */}
      <rect x="6" y="20.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}

/**
 * Versi Logo Gambar Lengkap (Termasuk Teks MY POS - TOKO SERBA ADA)
 */
export function AppLogoFull({ className = "h-14 w-auto", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-512x512.png"
      alt="My POS - Toko Serba Ada"
      className={className}
      {...props}
    />
  );
}
