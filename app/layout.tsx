import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { AIDrawerProvider } from "@/components/providers/AIDrawerProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Agency OS",
    template: "%s · Agency OS",
  },
  description: "One operating system for the marketing agency: brands, Meta, Google, Shopify sales, targets, tasks, team, reports and Agency AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppStateProvider>
          <AIDrawerProvider>
            <TooltipProvider>
              <AppShell>{children}</AppShell>
            </TooltipProvider>
          </AIDrawerProvider>
        </AppStateProvider>
      </body>
    </html>
  );
}
