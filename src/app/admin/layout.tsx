import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PRIVATE_ROBOTS } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: PRIVATE_ROBOTS,
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
