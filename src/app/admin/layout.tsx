import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reservas · Fogo de Chão Ventura", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
