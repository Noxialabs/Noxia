import { AppConfig } from "@/config/app.config";
import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/reusable/Navbar";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: AppConfig().app.name,
  description: AppConfig().app.slogan,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
