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
} from "lucide-react";
import Link from "next/link";

const data = {
  user: {
    name: "Kasir Utama",
    email: "kasir@mypos.local",
    avatar: "",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Transaksi (Kasir)",
      url: "/dashboard/transaksi",
      icon: <CreditCard />,
    },
    {
      title: "Riwayat Transaksi",
      url: "/dashboard/riwayat",
      icon: <Receipt />,
    },
    {
      title: "Buku Kasbon",
      url: "/dashboard/kasbon",
      icon: <BookOpenCheck />,
    },
    {
      title: "Laba Rugi",
      url: "/dashboard/laba-rugi",
      icon: <TrendingUp />,
    },
    {
      title: "Promo",
      url: "/dashboard/promo",
      icon: <Gift />,
    },
    {
      title: "Stok Masuk",
      url: "/dashboard/pembelian",
      icon: <PackagePlus />,
    },
    {
      title: "Stok Opname",
      url: "/dashboard/stok-opname",
      icon: <ClipboardCheck />,
    },
    {
      title: "Barang",
      url: "/dashboard/barang",
      icon: <Barcode />,
    },
    {
      title: "Kategori",
      url: "/dashboard/kategori",
      icon: <Tags />,
    },
    {
      title: "Satuan",
      url: "/dashboard/satuan",
      icon: <ChartBarStacked />,
    },
    {
      title: "Supplier",
      url: "/dashboard/supplier",
      icon: <BookUser />,
    },
    {
      title: "Member",
      url: "/dashboard/member",
      icon: <UsersIcon />,
    },
    {
      title: "Pengaturan Toko",
      url: "/dashboard/pengaturan",
      icon: <Settings />,
    },
    {
      title: "User",
      url: "#",
      icon: <UsersIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">My POS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
