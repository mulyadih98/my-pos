"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Command, Eye, EyeOff, Lock, User, ShieldCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password) {
      toast.error("Masukkan username dan password Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser({
        username: username.trim(),
        password,
      });

      if (res.success) {
        toast.success(`Selamat datang kembali, ${res.user.nama}!`);
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal melakukan login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-border/80 backdrop-blur bg-card/95">
      <CardHeader className="text-center space-y-2 pb-6">
        <div className="mx-auto size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
          <Command className="size-6" />
        </div>
        <div>
          <CardTitle className="text-2xl font-black tracking-tight">Masuk ke My POS</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Sistem Kasir & Manajemen Inventori Toko Retail
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold">
              Username
            </Label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="owner / kasir"
                className="pl-9 h-11 text-sm bg-background"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">
                Kata Sandi
              </Label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-9 pr-10 h-11 text-sm bg-background font-mono"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 font-bold text-sm shadow-md gap-2"
          >
            {isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>
        </form>

        {/* Tombol Cepat Pengisian Akun Demo (Bawaan) */}
        <div className="space-y-2 pt-2 border-t text-xs">
          <p className="text-[11px] font-semibold text-muted-foreground text-center uppercase tracking-wider">
            Pilihan Akun Cepat (Default):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill("owner", "owner123")}
              className="h-auto py-2 px-2.5 flex flex-col items-start text-left hover:border-primary/50"
            >
              <div className="flex items-center gap-1 font-bold text-xs text-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Owner
              </div>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                owner / owner123
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuickFill("kasir", "kasir123")}
              className="h-auto py-2 px-2.5 flex flex-col items-start text-left hover:border-primary/50"
            >
              <div className="flex items-center gap-1 font-bold text-xs text-foreground">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" /> Kasir
              </div>
              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                kasir / kasir123
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
