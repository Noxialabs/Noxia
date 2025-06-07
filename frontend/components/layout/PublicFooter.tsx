// components/layout/PublicFooter.tsx
"use client";

import React from 'react';
import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">999</span>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                999Plus
              </span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md leading-relaxed">
              Fighting corruption and injustice through technology. Report crimes, track cases, and ensure accountability with blockchain-verified evidence.
            </p>
            <p className="text-sm text-gray-400 italic">
              Dedicated to the memory of those lost to systematic corruption.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/#about' },
                { label: 'How It Works', href: '/#features' },
                /* { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' } */
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-3">
              {[
                { label: 'Contact Us', href: '/#contact' },
                { label: 'Emergency Resources', href: '/#' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="text-gray-300 hover:text-blue-400 transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 999Plus. All rights reserved. | Fighting for justice, one case at a time.
          </p>
        </div>
      </div>
    </footer>
  );
}