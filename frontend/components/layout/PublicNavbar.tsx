"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function PublicNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const navigateToSection = (sectionId: string) => {
    router.push(`/#${sectionId}`);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
      setIsMenuOpen(false);
    }, 500);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-white-900 to-blue-200 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                <img src="/logoImg.png" alt="Logo"className="w-10 h-10"/>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                999Plus
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {[
              { label: "Features", id: "features" },
              { label: "About", id: "about" },
              { label: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className="text-gray-600 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-blue-50"
              >
                {item.label}
              </button>
            ))}

            {isAuthenticated ? (
              <div className="flex items-center space-x-3 ml-4">
                <span className="text-sm text-gray-600">
                  Welcome, {user?.email?.split("@")[0]}
                </span>
                <Link
                  href="/dashboard"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg hover:bg-blue-50 ml-4"
                >
                  Login
                </Link>
                <Link
                  href="/case-submission-form"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-200 ${
                  isMenuOpen ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 bg-white">
            {[
              { label: "Features", id: "features" },
              { label: "About", id: "about" },
              { label: "Contact", id: "contact" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}

            {isAuthenticated ? (
              <div className="pt-2 border-t border-gray-200">
                <div className="px-3 py-2 text-sm text-gray-600">
                  Welcome, {user?.email?.split("@")[0]}
                </div>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-center mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/case-submission-form"
                  className="block px-3 py-2 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-center mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
