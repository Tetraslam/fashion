import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Nav, NavFrame } from "@/components/nav";
import { Palette } from "@/components/palette";
import { AddItemDialog } from "@/components/add-item-dialog";
import "./globals.css";

const ui = Geist({ subsets: ["latin"], variable: "--font-ui" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });

export const metadata: Metadata = {
  title: { default: "closet", template: "%s / closet" },
  description: "tetraslam's wardrobe: lookbook, pieces, Grailed hunting, buy plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${ui.variable} ${code.variable} ${serif.variable} antialiased`}>
      <body className="min-h-dvh bg-background text-foreground">
        <NuqsAdapter>
          <TooltipProvider delayDuration={300}>
            <Suspense fallback={<NavFrame />}>
              <Nav />
            </Suspense>
            <main className="mx-auto w-full max-w-[1440px] px-5 pt-6 pb-24 md:px-8">{children}</main>
            <Suspense fallback={null}>
              <Palette />
              <AddItemDialog />
            </Suspense>
            <Toaster position="bottom-right" />
          </TooltipProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
