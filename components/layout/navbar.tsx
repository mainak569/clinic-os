"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Menu, X } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="sticky top-4 z-50 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Logo - Separate Glass Button */}
          <Link href="/" className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A855F7] shadow-md">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#A855F7]">
              ClinicOS
            </span>
          </Link>

          {/* Desktop Navigation - Center Glass Bar */}
          <div className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-full bg-white/70 backdrop-blur-xl shadow-lg">
            <Link
              href="#features"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-full transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Contact
            </Link>
          </div>

          {/* Desktop CTA - Right Glass Buttons */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 rounded-full bg-white/70 backdrop-blur-xl shadow-lg hover:bg-white/80 hover:shadow-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-medium text-white rounded-full bg-[#A855F7] shadow-lg hover:bg-[#9333EA] hover:shadow-xl hover:scale-105 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2.5 rounded-full bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isOpen ? (
              <X className="h-5 w-5 text-gray-700" />
            ) : (
              <Menu className="h-5 w-5 text-gray-700" />
            )}
            <span className="sr-only">Toggle menu</span>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isOpen && (
          <div className="md:hidden mt-3 rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-5">
            <div className="p-3 space-y-1">
              <Link
                href="#features"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-2xl hover:bg-white/60 hover:text-[#A855F7] transition-all"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-2xl hover:bg-white/60 hover:text-[#A855F7] transition-all"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-2xl hover:bg-white/60 hover:text-[#A855F7] transition-all"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="#contact"
                className="block px-4 py-3 text-base font-medium text-gray-700 rounded-2xl hover:bg-white/60 hover:text-[#A855F7] transition-all"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              
              <div className="pt-3 mt-3 border-t space-y-2">
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 rounded-2xl bg-white/60 hover:bg-white/80 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-white rounded-2xl bg-[#A855F7] shadow-lg hover:bg-[#9333EA] hover:shadow-xl transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
