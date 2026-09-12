import { Button } from "@/components/ui/button";
import { GlassBackground } from "@/components/layout/glass-background";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Access Denied - ClinicOS",
  description: "You don't have permission to access this resource",
};

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <GlassBackground />

      <div className="w-full max-w-md rounded-3xl bg-white/70 backdrop-blur-xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-500/10 p-6">
            <ShieldAlert className="h-12 w-12 text-red-500" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold">Access Denied</h1>
        <p className="mb-6 text-muted-foreground">
          You don&apos;t have permission to access this resource. Providers can
          only see their own patients and schedule. If you believe this is an
          error, please contact your administrator.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
