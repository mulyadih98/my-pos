import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { UiFontProvider } from "@/components/theme/ui-font-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "My POS - Aplikasi Kasir & Manajemen Toko",
    template: "%s | My POS",
  },
  description:
    "Sistem Kasir (Point of Sale), Manajemen Inventori Barang, dan Pembukuan Keuangan Toko Modern",
  applicationName: "My POS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My POS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var s = localStorage.getItem("pos_store_settings");
                if (s) {
                  var p = JSON.parse(s);
                  if (p.uiFontSize) document.documentElement.setAttribute("data-ui-font-size", p.uiFontSize);
                  if (p.uiFontWeight) document.documentElement.setAttribute("data-ui-font-weight", p.uiFontWeight);
                  if (p.uiFontFamily) document.documentElement.setAttribute("data-ui-font-family", p.uiFontFamily);
                } else {
                  document.documentElement.setAttribute("data-ui-font-size", "md");
                  document.documentElement.setAttribute("data-ui-font-weight", "normal");
                  document.documentElement.setAttribute("data-ui-font-family", "sans");
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <PwaRegister />
        <UiFontProvider />
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
