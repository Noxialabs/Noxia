/* "use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAccess = async () => {
    if (!alias.trim()) {
      toast.error("Please enter an alias code");
      return;
    }

    setIsLoading(true);
    try {
      // Navigate to the alias dashboard with the reference code
      router.push(`/alias-dashboard/${encodeURIComponent(alias)}`);
    } catch (error) {
      toast.error("Failed to access the reference code");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-[846px] mx-auto mt-[85px] flex flex-col rounded-[12px] bg-gradient-to-b from-[#80CFEC3D] to-[#149FD23D] [background-image:linear-gradient(171deg,rgba(128,207,236,0.24)_-10.49%,rgba(20,159,210,0.24)_119.61%)] p-6 md:p-10">
        <div className="max-w-[536px] mx-auto flex flex-col items-center justify-center gap-2 pb-[10px] border-b-[2px] border-b-[#3B82F6] mb-[38px]">
          <h1 className="shrink-0 text-center text-[24px] md:text-[32px] text-[#1D1F2C] font-semibold leading-[160%]">
            999plus - Case Submission Form
          </h1>
          <p className="max-w-[330px] mx-auto text-[16px] text-center leading-[160%] font-normal text-[#1D1F2C]">
            Anonymous. Secure. Tamper-proof. Submit your case without logging
            in.
          </p>
        </div>
        <div className="w-full flex flex-col sm:flex-row gap-6">
          <Link
            href="/cases/case-submission-form"
            className="w-full py-4 px-7 bg-[#1D1F2C] text-white rounded-[10px] text-[16px] font-semibold leading-[160%] text-center"
          >
            Start New Submission
          </Link>
          <Link
            href="/secure-application"
            className="w-full py-4 px-7 bg-[#1D1F2C] text-white rounded-[10px] text-[16px] font-semibold leading-[160%] text-center"
          >
            Secure Application
          </Link>
        </div>
      </div>
    </>
  );
}
 */

/* Usage Example: app/page.tsx */
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';

export default function HomePage() {
  return (
    <AppLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section id="hero" className="relative min-h-[80vh] flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6 pb-2">
                Fight Corruption with Technology
                </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Report crimes, track cases, and ensure accountability with blockchain-verified evidence. Join the movement for justice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/auth/register"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  Start Fighting Corruption
                </a>
                <a
                  href="#features"
                  className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Powerful Features for Justice
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to report, track, and resolve corruption cases
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🛡️",
                  title: "Secure Reporting",
                  description: "Anonymous and secure case submission with end-to-end encryption"
                },
                {
                  icon: "🔗",
                  title: "Blockchain Verified",
                  description: "Immutable evidence storage using blockchain technology"
                },
                {
                  icon: "📊",
                  title: "Real-time Tracking",
                  description: "Monitor case progress and receive instant updates"
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Why 999Plus Exists
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Born from the tragedy of lives lost to systematic corruption, 999Plus leverages cutting-edge technology to ensure that justice is not just served, but guaranteed.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Our platform combines blockchain verification, AI-powered case analysis, and community-driven accountability to create an unstoppable force against corruption.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                    <span className="text-2xl font-bold text-blue-600">10,000+</span>
                    <p className="text-sm text-gray-600">Cases Submitted</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                    <span className="text-2xl font-bold text-green-600">85%</span>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-md">
                    <span className="text-2xl font-bold text-purple-600">24/7</span>
                    <p className="text-sm text-gray-600">Support Available</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                  <p className="text-blue-100 mb-6">
                    To create a world where corruption cannot hide, where justice is transparent, and where every voice matters in the fight for accountability.
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚖️</span>
                    </div>
                    <div>
                      <p className="font-semibold">Justice Through Technology</p>
                      <p className="text-sm text-blue-200">Powered by community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of citizens fighting corruption with technology
            </p>
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Get in Touch</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">📧</span>
                      <span className="text-gray-600">support@999plus.org</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">📞</span>
                      <span className="text-gray-600">+1 (555) 999-PLUS</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">🌍</span>
                      <span className="text-gray-600">Global Operations</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Emergency Resources</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-red-600">🚨</span>
                      <span className="text-gray-600">24/7 Crisis Hotline</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600">⚖️</span>
                      <span className="text-gray-600">Legal Aid Network</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-purple-600">🛡️</span>
                      <span className="text-gray-600">Witness Protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}