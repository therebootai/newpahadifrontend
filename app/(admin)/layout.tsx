import type { Metadata } from "next";
import localFont from "next/font/local";
import "./admin.css";
import { Toaster } from "sonner";
import AdminGuard from "@/components/admin/AdminGuard";
import QueryProvider from "@/components/providers/QueryProvider";
import ProgressProvider from "@/components/providers/ProgressProvider";

const futura = localFont({
  src: [
    { path: "../fonts/FuturaPTLight.otf", weight: "300", style: "normal" },
    { path: "../fonts/FuturaPTLightOblique.otf", weight: "300", style: "italic" },
    { path: "../fonts/FuturaPTBook.otf", weight: "400", style: "normal" },
    { path: "../fonts/FuturaPTBookOblique.otf", weight: "400", style: "italic" },
    { path: "../fonts/FuturaPTMedium.otf", weight: "500", style: "normal" },
    { path: "../fonts/FuturaPTMediumOblique.otf", weight: "500", style: "italic" },
    { path: "../fonts/FuturaPTDemi.otf", weight: "600", style: "normal" },
    { path: "../fonts/FuturaPTDemiOblique.otf", weight: "600", style: "italic" },
    { path: "../fonts/FuturaPTBold.otf", weight: "700", style: "normal" },
    { path: "../fonts/FuturaPTBoldOblique.otf", weight: "700", style: "italic" },
    { path: "../fonts/FuturaPTExtraBold.otf", weight: "800", style: "normal" },
    { path: "../fonts/FuturaPTExtraBoldOblique.otf", weight: "800", style: "italic" },
    { path: "../fonts/FuturaPTHeavy.otf", weight: "900", style: "normal" },
    { path: "../fonts/FuturaPTHeavyOblique.otf", weight: "900", style: "italic" },
  ],
  variable: "--font-futura-raw",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pahadi Collections Admin",
  description: "pahadi Collection Admin Panel",
};

export default function RootAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${futura.variable} antialiased`}>
      <body className="min-h-full bg-[#f7f8fa] text-[#222222] font-futura font-medium">
        <Toaster position="top-right" richColors closeButton />
        <ProgressProvider>
          <QueryProvider>
            <AdminGuard>
              {children}
            </AdminGuard>
          </QueryProvider>
       </ProgressProvider>
      </body>
    </html>
  );
}
