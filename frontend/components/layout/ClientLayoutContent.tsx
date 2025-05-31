"use client";

import React, { useState } from 'react';
interface User {
  id: string;
  email: string;
  ethAddress?: string;
  tier: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientLayoutContentProps {
  children: React.ReactNode;
  initialUser: User | null;
  initialIsAuthenticated: boolean;
}

export default function ClientLayoutContent({ 
  children, 
  initialUser, 
  initialIsAuthenticated 
}: ClientLayoutContentProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {initialIsAuthenticated ? (
        <AuthenticatedLayout user={initialUser}>
          {children}
        </AuthenticatedLayout>
      ) : (
        <PublicLayout>
          {children}
        </PublicLayout>
      )}
    </div>
  );
}

// Public Layout for non-authenticated users
const PublicLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen">
    <PublicNavbar />
    <main className="min-h-screen">
      {children}
    </main>
    <PublicFooter />
  </div>
);

// Authenticated Layout for logged-in users
const AuthenticatedLayout = ({ children, user }: { children: React.ReactNode; user: any }) => (
  <div className="min-h-screen flex">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <AuthenticatedNavbar user={user} />
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  </div>
);

// Public Navbar Component
const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                <img className="text-white font-bold text-lg" src='../../logoImg.png'/>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">999Plus</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
              Features
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
              About
            </a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors">
              Contact
            </a>
            <a 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-700 px-3 py-2 text-sm font-medium transition-colors"
            >
              Login
            </a>
            <a 
              href="/auth/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">
                Features
              </a>
              <a href="#about" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">
                About
              </a>
              <a href="#contact" className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900">
                Contact
              </a>
              <a href="/login" className="block px-3 py-2 text-base font-medium text-blue-600 hover:text-blue-700">
                Login
              </a>
              <a href="/register" className="block px-3 py-2 text-base font-medium bg-blue-600 text-white rounded-lg">
                Get Started
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Authenticated Navbar Component
const AuthenticatedNavbar = ({ user }: { user: any }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {user?.email || 'User'}</p>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Profile Settings
              </a>
              <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Account Settings
              </a>
              <hr className="my-1" />
              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

// Sidebar Component
const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard', active: true },
    { icon: '📋', label: 'Submit Case', href: '/cases/submit' },
    { icon: '📁', label: 'My Cases', href: '/cases' },
    { icon: '📊', label: 'Analytics', href: '/analytics' },
    { icon: '📄', label: 'Documents', href: '/documents' },
    { icon: '🔔', label: 'Notifications', href: '/notifications' },
    { icon: '⚙️', label: 'Settings', href: '/settings' },
  ];

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">999</span>
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-lg font-bold">999Plus</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center px-3 py-3 mb-1 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 left-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Public Footer Component
const PublicFooter = () => (
  <footer className="bg-gray-900 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo & Description */}
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center">
                <img className="text-white font-bold text-lg" src='../../logoImg.png'/>
            </div>
            <span className="ml-3 text-xl font-bold">999Plus</span>
          </div>
          <p className="text-gray-300 mb-4 max-w-md">
            Fighting corruption and injustice through technology. Report crimes, track cases, and ensure accountability with blockchain-verified evidence.
          </p>
          <p className="text-sm text-gray-400">
            Dedicated to the memory of those lost to systematic corruption.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-2">
            <li><a href="/about" className="text-gray-300 hover:text-white transition-colors">About Us</a></li>
            <li><a href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a></li>
            <li><a href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Support</h3>
          <ul className="space-y-2">
            <li><a href="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
            <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
            <li><a href="/emergency" className="text-gray-300 hover:text-white transition-colors">Emergency Resources</a></li>
            <li><a href="/legal-aid" className="text-gray-300 hover:text-white transition-colors">Legal Aid</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 mt-8 pt-8 text-center">
        <p className="text-gray-400">
          © 2025 999Plus. All rights reserved. | Fighting for justice, one case at a time.
        </p>
      </div>
    </div>
  </footer>
);