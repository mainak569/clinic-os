"use client";

import { Button } from "@/components/ui/button";
import { LogOut, User, Shield } from "lucide-react";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";

interface UserMenuProps {
  email: string;
  role: Role;
  providerName?: string | null;
}

export function UserMenu({ email, role, providerName }: UserMenuProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const roleName = role === "FRONT_DESK" ? "Front Desk Staff" : "Provider";

  return (
    <div className="flex items-center gap-4">
      {/* User Info */}
      <div className="flex items-center gap-3 rounded-lg bg-card px-3 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          {role === "PROVIDER" ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="text-sm">
          <p className="font-medium">
            {providerName ? `Dr. ${providerName}` : email}
          </p>
          <p className="text-xs text-muted-foreground">{roleName}</p>
        </div>
      </div>

      {/* Sign Out Button */}
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
