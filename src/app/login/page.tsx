import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login - My POS Store",
  description: "Masuk ke sistem Point of Sale dan Manajemen Toko Retail",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30 dark:bg-zinc-950 relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Memuat halaman login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
