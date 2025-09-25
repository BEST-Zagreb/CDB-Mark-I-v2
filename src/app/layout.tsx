import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import QueryProvider from "@/providers/query-provider";
import ReactScanProvider from "@/providers/react-scan-provider";
import { DeleteAlertProvider } from "@/contexts/delete-alert-context";
import "./globals.css";
import Footer from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cdb.best.hr"),
  title: {
    default: "Company Database",
    template: "CDB - %s",
  },
  description:
    "Web and mobile (PWA) application for managing contacts for fundraising per project.",
  creator: "Jakov Jakovac",
  keywords: [
    "Company Database",
    "CDB",
    "Contacts",
    "CRM",
    "Fundraising",
    "Networking",
    "Project Management",
    "Collaboration",
    "Business Development",
    "Client Management",
    "Customer Relationships",
    "Open Source",
    "Productivity",
    "Organization",
    "Entrepreneurship",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <ReactScanProvider />
        <QueryProvider>
          <DeleteAlertProvider>
            <SidebarProvider>
              <div className="min-h-screen flex flex-col w-full">
                <AppSidebar />
                <main className="w-full">
                  <Header />
                  <div className="pt-24 max-w-7xl mx-auto">{children}</div>
                </main>
                <Footer />
              </div>
            </SidebarProvider>
          </DeleteAlertProvider>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
