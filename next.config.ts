import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // evita che Next scambi la home utente (che ha un package-lock.json) per la root
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
