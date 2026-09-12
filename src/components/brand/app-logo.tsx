import React from "react";

interface AppLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Logo Resmi Storefront My POS - Toko Serba Ada
 * Berdasarkan desain etalase toko retail dengan kanopi dan shopping cart
 */
export function AppLogo({ className = "size-6", size, ...props }: AppLogoProps) {
  const sageColor = "#6e9360";

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
      {/* Top Roof Bar */}
      <rect x="5" y="2.5" width="14" height="1.2" rx="0.6" fill={sageColor} />

      {/* Canopy / Awning */}
      <path
        d="M4.5 4 C4.2 4 3.8 5 3.3 7.5 C3 9.2 3.8 10 4.8 9.5 C5.8 10 7.4 10 8.4 9.5 C9.4 10 11 10 12 9.5 C13 10 14.6 10 15.6 9.5 C16.6 10 18.2 10 19.2 9.5 C20.2 10 21 9.2 20.7 7.5 C20.2 5 19.8 4 19.5 4 Z"
        fill={sageColor}
      />
      
      {/* Canopy Stripes */}
      <path d="M7.5 4 V9.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M10.5 4 V9.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M13.5 4 V9.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" />
      <path d="M16.5 4 V9.5" stroke="white" strokeWidth="0.5" strokeLinecap="round" />

      {/* Outer Walls & Base */}
      <path
        d="M4.5 10 V17.5 H3.8 C3.4 17.5 3 17.9 3 18.3 C3 18.7 3.4 19.1 3.8 19.1 H20.2 C20.6 19.1 21 18.7 21 18.3 C21 17.9 20.6 17.5 20.2 17.5 H19.5 V10"
        stroke={sageColor}
        strokeWidth="0.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Left Door Frame */}
      <rect x="5.8" y="10.8" width="4.8" height="6.7" rx="0.5" stroke={sageColor} strokeWidth="0.8" fill="white" />
      
      {/* Shopping Cart inside Door */}
      <g transform="translate(6.5, 13.8) scale(0.12)" stroke={sageColor} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="22" r="2" fill={sageColor} stroke="none" />
        <circle cx="16" cy="22" r="2" fill={sageColor} stroke="none" />
        <path d="M1 3 H4 L7 17 H18 L20 7 H6" strokeWidth="2.2" fill="none" />
      </g>

      {/* Right Window Showcase */}
      <rect x="12" y="10.8" width="6.2" height="4.2" rx="0.5" stroke={sageColor} strokeWidth="0.8" fill={sageColor} />
      {/* Window Shelf */}
      <rect x="12" y="15.8" width="6.2" height="1.7" rx="0.3" stroke={sageColor} strokeWidth="0.8" fill="none" />

      {/* Ribbon Banner at bottom */}
      <path d="M4 20 L5.2 21.2 L4 22.4 H20 L18.8 21.2 L20 20 Z" fill={sageColor} />
      <circle cx="12" cy="21.2" r="0.6" fill="white" />
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
