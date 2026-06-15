import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import CartSyncProvider from "@/components/providers/CartSyncProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import ProgressProvider from "@/components/providers/ProgressProvider";
import { Toaster } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";

export const revalidate = 60; // Revalidate every 60 seconds

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
  title: "Pahadi Collections",
  icons: {
    icon: "/favicon.png",
  },
  description: "Pahadi Collections - Premium Jewellery storefront",
};

export default function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${futura.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-futura overflow-x-hidden">
        <Toaster position="top-right" richColors closeButton />
        <ProgressProvider>
          <QueryProvider>
            <CartSyncProvider />
            <Suspense fallback={<div className="h-16 w-full animate-pulse bg-gray-50" />}>
              <Header />
            </Suspense>
            {children}
            <Footer />
          </QueryProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
