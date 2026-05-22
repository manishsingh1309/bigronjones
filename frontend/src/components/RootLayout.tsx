import type { ReactNode } from "react";
import CustomCursor from "@/components/layout/CustomCursor";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Toaster from "@/components/ui/Toaster";
import Analytics from "@/components/analytics/Analytics";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CustomCursor />
      <Navbar />
      <main className="pt-[28px]">{children}</main>
      <Footer />
      <Toaster />
      <Analytics />
    </>
  );
}
