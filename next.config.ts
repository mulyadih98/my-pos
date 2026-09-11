import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: false,
  allowedDevOrigins: [
    "192.168.18.18:3000",
    "lat-relating-min-cool.trycloudflare.com",
    "hazardous-timer-jury-sig.trycloudflare.com",
    "*.trycloudflare.com",
    "43.157.251.227",
    "43.157.251.227:3000",
  ],
};

export default nextConfig;
