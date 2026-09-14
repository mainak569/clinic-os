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
          <Link
            href="/"
            className="flex shrink-0 items-center space-x-2 rounded-full bg-white/70 px-4 py-2.5 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A855F7] shadow-md">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#A855F7]">ClinicOS</span>
          </Link>

          {/* Desktop Navigation - Center Glass Bar */}
          <div className="hidden items-center gap-1 rounded-full bg-white/70 px-2 py-1.5 shadow-lg backdrop-blur-xl md:flex">
            <Link
              href="#features"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Pricing
            </Link>
            <Link
              href="#about"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              About
            </Link>
            <Link
              href="#contact"
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
            >
              Contact
            </Link>
          </div>

          {/* Desktop CTA - Right Glass Buttons */}
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-full bg-white/70 px-5 py-2.5 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:bg-white/80 hover:shadow-xl"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#A855F7] px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:scale-105 hover:bg-[#9333EA] hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="rounded-full bg-white/70 p-2.5 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl md:hidden"
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
          <div className="mt-3 overflow-hidden rounded-3xl bg-white/70 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top-5 md:hidden">
            <div className="space-y-1 p-3">
              <Link
                href="#features"
                className="block rounded-2xl px-4 py-3 text-base font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7]"
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="block rounded-2xl px-4 py-3 text-base font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7]"
                onClick={() => setIsOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#about"
                className="block rounded-2xl px-4 py-3 text-base font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7]"
                onClick={() => setIsOpen(false)}
              >
                About
              </Link>
              <Link
                href="#contact"
                className="block rounded-2xl px-4 py-3 text-base font-medium text-gray-700 transition-all hover:bg-white/60 hover:text-[#A855F7]"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>

              <div className="mt-3 space-y-2 border-t pt-3">
                <Link
                  href="/login"
                  className="block w-full rounded-2xl bg-white/60 px-4 py-3 text-center text-base font-medium text-gray-700 transition-all hover:bg-white/80"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="block w-full rounded-2xl bg-[#A855F7] px-4 py-3 text-center text-base font-medium text-white shadow-lg transition-all hover:bg-[#9333EA] hover:shadow-xl"
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
