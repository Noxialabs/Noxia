import React from 'react';
import { AppConfig } from "@/config/app.config";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "@/context/AuthContext";
import { headers } from 'next/headers';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: AppConfig().app.name,
  description: AppConfig().app.slogan,
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#2563eb',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get initial auth state server-side
  const headersList =await headers();
  const userAgent = headersList.get('user-agent') || '';
  
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <div id="root" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {children}
          </div>
          <ToastContainer 
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            className="mt-16 z-[9999]"
            toastClassName="shadow-lg border border-gray-100"
          />
        </AuthProvider>
      </body>
    </html>
  );
}