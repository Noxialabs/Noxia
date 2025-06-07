"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '📋', label: 'Submit Case', href: '/case-submission-form' },
    { icon: '📁', label: 'All Cases', href: '/cases' },
   /*  { icon: '📊', label: 'Analytics', href: '/analytics' },
    { icon: '📄', label: 'Documents', href: '/documents' },
    { icon: '🔔', label: 'Notifications', href: '/notifications' },
    { icon: '⚙️', label: 'Settings', href: '/settings' }, */
  ];

  return (
    <div className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-30 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">999</span>
          </div>
          {!collapsed && (
            <span className="ml-3 text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              999Plus
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center px-3 py-3 mb-1 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {!collapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
              {collapsed && (
                <div className="fixed left-16 bg-gray-800 text-white px-2 py-1 rounded-md text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-4 left-4">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg 
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} 
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
}
