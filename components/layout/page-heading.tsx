import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One page title treatment for every dashboard route, so Appointments,
 * Patients and Schedule introduce themselves the same way.
 */
export function PageHeading({
  icon: Icon,
  title,
  description,
  actions,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-[#A855F7] shadow-lg" />
              <div className="absolute inset-0 rounded-2xl bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-md" />
              <Icon className="relative h-5 w-5 text-white drop-shadow-sm" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 [text-shadow:0_1px_14px_rgba(255,255,255,0.9)] sm:text-3xl">
            {title}
          </h1>
        </div>
        {description && (
          <p className="mt-2 max-w-2xl text-sm font-medium text-gray-700 [text-shadow:0_1px_10px_rgba(255,255,255,0.95)] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
