"use client";

import * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  UsersIcon,
  CommandIcon,
  Barcode,
  ChartBarStacked,
  BookUser,
  CreditCard,
  Receipt,
  Tags,
  Gift,
  PackagePlus,
  ClipboardCheck,
  Settings,
  TrendingUp,
  BookOpenCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { UserSession } from "@/lib/auth";
import { InstallPwaButton } from "@/components/pwa/install-pwa-button";
import { AppLogo } from "@/components/brand/app-logo";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentUser?: UserSession | null;
}

export function AppSidebar({ currentUser, ...props }: AppSidebarProps) {
  const isOwner = currentUser?.role === "OWNER";

  const allNavItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      ownerOnly: true,
    },
    {
      title: "Transaksi (Kasir)",
      url: "/dashboard/transaksi",
      icon: <CreditCard />,
      ownerOnly: false,
    },
    {
      title: "Riwayat Transaksi",
      url: "/dashboard/riwayat",
      icon: <Receipt />,
      ownerOnly: false,
    },
    {
      title: "Buku Kasbon",
      url: "/dashboard/kasbon",
      icon: <BookOpenCheck />,
      ownerOnly: false,
    },
    {
      title: "Laba Rugi",
      url: "/dashboard/laba-rugi",
      icon: <TrendingUp />,
      ownerOnly: true,
    },
    {
      title: "Biaya Operasional",
      url: "/dashboard/operasional",
      icon: <Wallet />,
      ownerOnly: true,
    },
    {
      title: "Promo",
      url: "/dashboard/promo",
      icon: <Gift />,
      ownerOnly: true,
    },
    {
      title: "Stok Masuk",
      url: "/dashboard/pembelian",
      icon: <PackagePlus />,
      ownerOnly: true,
    },
    {
      title: "Stok Opname",
      url: "/dashboard/stok-opname",
      icon: <ClipboardCheck />,
      ownerOnly: true,
    },
    {
      title: "Barang",
      url: "/dashboard/barang",
      icon: <Barcode />,
      ownerOnly: false,
    },
    {
      title: "Kategori",
      url: "/dashboard/kategori",
      icon: <Tags />,
      ownerOnly: true,
    },
    {
      title: "Satuan",
      url: "/dashboard/satuan",
      icon: <ChartBarStacked />,
      ownerOnly: true,
    },
    {
      title: "Supplier",
      url: "/dashboard/supplier",
      icon: <BookUser />,
      ownerOnly: true,
    },
    {
      title: "Member",
      url: "/dashboard/member",
      icon: <UsersIcon />,
      ownerOnly: false,
    },
    {
      title: "Pengaturan Toko",
      url: "/dashboard/pengaturan",
      icon: <Settings />,
      ownerOnly: true,
    },
    {
      title: "Manajemen User",
      url: "/dashboard/user",
      icon: <UsersIcon />,
      ownerOnly: true,
    },
  ];

  // Saring menu sesuai peran pengguna
  const visibleNavItems = allNavItems.filter((item) => {
    if (isOwner) return true;
    return !item.ownerOnly;
  });

  const userData = {
    name: currentUser?.nama || (isOwner ? "Owner Toko" : "Kasir Utama"),
    username: currentUser?.username || (isOwner ? "owner" : "kasir"),
    role: (currentUser?.role || "KASIR") as "OWNER" | "KASIR",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href={isOwner ? "/dashboard" : "/dashboard/transaksi"}>
                <AppLogo className="size-5.5! shrink-0" />
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold leading-none">My POS</span>
                  <span className="text-[9px] text-muted-foreground font-medium mt-0.5">Toko Serba Ada</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
      </SidebarContent>
      <SidebarFooter className="gap-2 p-2">
        <InstallPwaButton />
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
