"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Calendar,
  Clock,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AlertsDropdown } from "@/components/layout/alerts-dropdown";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Roles that see this item; omitted means everyone. */
  roles?: string[];
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/schedule", label: "Schedule", icon: Clock },
  { href: "/dashboard/providers", label: "Providers", icon: Stethoscope, roles: ["FRONT_DESK"] },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

/**
 * The floating glass header, in the same language as the marketing navbar.
 *
 * Every dashboard route now renders this. Previously only /dashboard had a
 * header — Appointments, Patients and Schedule had no branding and no way back
 * except the browser's back button.
 */
export function DashboardHeader({
  email,
  role,
  providerName,
}: {
  email: string;
  role: string;
  providerName?: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(role));

  React.useEffect(() => setOpen(false), [pathname]);

  const roleLabel = role === "FRONT_DESK" ? "Front Desk" : "Provider";
  const displayName = providerName ? `Dr. ${providerName}` : email;

  return (
    <header className="sticky top-4 z-50 px-4">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between gap-4 rounded-full bg-white/70 backdrop-blur-xl shadow-lg px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center space-x-2 rounded-full transition-opacity hover:opacity-80"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#A855F7] shadow-md">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#A855F7]">ClinicOS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNav.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-[#A855F7] text-white shadow-md"
                      : "text-gray-700 hover:bg-white/60 hover:text-[#A855F7] hover:shadow-md"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <AlertsDropdown />

            <div className="hidden xl:flex items-center gap-2 rounded-full bg-white/50 backdrop-blur-sm px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#A855F7]/10 text-xs font-bold text-[#A855F7]">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="max-w-[10rem] text-sm leading-tight">
                <p className="truncate font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{roleLabel}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="hidden sm:flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 shadow-md transition-all hover:bg-white/80 hover:text-[#A855F7] hover:shadow-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign Out</span>
            </button>

            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden rounded-full bg-white/60 p-2.5 shadow-md transition-all hover:bg-white/80"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? (
                <X className="h-5 w-5 text-gray-700" />
              ) : (
                <Menu className="h-5 w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {open && (
          <div className="lg:hidden mt-3 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl animate-in slide-in-from-top-5">
            <div className="space-y-1 p-3">
              {visibleNav.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-medium transition-all",
                      active
                        ? "bg-[#A855F7] text-white shadow-md"
                        : "text-gray-700 hover:bg-white/70 hover:text-[#A855F7]"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-3 space-y-2 border-t border-white/60 pt-3">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A855F7]/10 text-sm font-bold text-[#A855F7]">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-sm leading-tight">
                    <p className="truncate font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-base font-medium text-gray-700 transition-all hover:bg-white hover:text-[#A855F7]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
