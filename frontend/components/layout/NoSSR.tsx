"use client";

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const NoSSR = ({ children, fallback }: NoSSRProps) => {
  return (
    <>
      {children}
    </>
  );
};

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading 999Plus...</h2>
        <p className="text-gray-500 mt-2">Securing your connection</p>
      </div>
    </div>
  )
});