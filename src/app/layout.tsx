// src/app/layout.tsx — root layout
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BannerStrip from "@/components/BannerStrip";
import PopupAd from "@/components/PopupAd";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSession } from "@/lib/auth";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin", "vietnamese"], // Hỗ trợ tiếng Việt hoàn chỉnh
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CDC Media – Ngân hàng Tài liệu Truyền thông CDC Đà Nẵng",
  description:
    "Hệ thống quản lý và chia sẻ tài liệu truyền thông sức khỏe của Trung tâm Kiểm soát Bệnh tật TP. Đà Nẵng",
  keywords: ["CDC Đà Nẵng", "truyền thông sức khỏe", "tài liệu y tế", "phòng chống dịch"],
  authors: [{ name: "CDC Đà Nẵng – Bộ phận IT" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="vi" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Next.js Script to prevent theme flash without React 19 warnings */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('cdc_theme');
                const supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && supportDark) || (theme === 'system' && supportDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#f0f4f8] dark:bg-[#0b1120] text-slate-800 dark:text-slate-100 bg-grid min-h-screen flex flex-col transition-colors duration-300">
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!rounded-2xl !shadow-lg !font-medium dark:!bg-slate-900 dark:!text-slate-100 dark:!border dark:!border-slate-800",
              duration: 3000,
            }}
          />
          <Navbar session={session} />
          
          {/* Banner ngang TOP — dưới Navbar, được ghim cố định */}
          <BannerStrip position="TOP" isSticky />
          
          <main className="flex-1">{children}</main>
          
          {/* Banner ngang BOTTOM — trên Footer */}
          <div className="max-w-7xl mx-auto px-2 sm:px-6 w-full my-3 sm:my-4">
            <BannerStrip position="BOTTOM" className="w-full overflow-hidden" />
          </div>
          
          <Footer />
          {/* Popup tuyên truyền */}
          <PopupAd />
        </ThemeProvider>
      </body>
    </html>
  );
}
