"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  EllipsisVerticalIcon,
  LogOutIcon,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { logoutUser } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    username: string;
    role: "OWNER" | "KASIR";
  };
}) {
  const { isMobile } = useSidebar();
  const isOwner = user.role === "OWNER";

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className={`rounded-lg font-bold text-xs ${isOwner ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-600"}`}>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-xs text-foreground">{user.name}</span>
                <span className="truncate text-[10px] text-muted-foreground font-mono">
                  @{user.username}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className={`rounded-lg font-bold text-xs ${isOwner ? "bg-primary/20 text-primary" : "bg-blue-500/20 text-blue-600"}`}>
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-xs">{user.name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {isOwner ? (
                      <Badge className="text-[9px] px-1 py-0 h-4 bg-primary text-primary-foreground font-bold gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> OWNER
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-bold gap-0.5">
                        <ShoppingBag className="w-2.5 h-2.5 text-blue-600" /> KASIR
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer font-semibold text-xs gap-2"
            >
              <LogOutIcon className="w-4 h-4" />
              Keluar (Log out)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
