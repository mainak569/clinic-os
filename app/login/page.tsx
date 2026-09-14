import { LoginForm } from "@/components/auth/login-form";
import {
  getLoginDemoAccounts,
  type DemoAccount,
} from "@/lib/services/demo-accounts.service";
import { MoltenBackground } from "@/components/layout/molten-background";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In - ClinicOS",
  description: "Sign in to your ClinicOS account",
};

// Rendered per request so added providers and changed passwords show at once.
export const dynamic = "force-dynamic";

/**
 * Loads the demo accounts inside the Suspense boundary, so the page shows its
 * skeleton instead of waiting on the query.
 */
async function LoginFormWithDemoAccounts() {
  let demoAccounts: DemoAccount[] = [];
  try {
    demoAccounts = await getLoginDemoAccounts();
  } catch (error) {
    // Signing in has to keep working even if the list can't be loaded.
    console.error("Failed to load demo accounts:", error);
  }
  return <LoginForm demoAccounts={demoAccounts} />;
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Same animated background as the home page */}
      <MoltenBackground />

      <Link
        href="/"
        className="absolute left-4 top-6 flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-gray-700 shadow-lg backdrop-blur-xl transition-all hover:bg-white/80 hover:text-[#A855F7] hover:shadow-xl sm:left-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center justify-center space-x-2 rounded-full bg-white/70 px-6 py-3 shadow-lg backdrop-blur-xl transition-all hover:shadow-xl"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#A855F7] shadow-md">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#A855F7]">ClinicOS</span>
        </Link>

        {/* Login Card */}
        <div className="rounded-3xl bg-white/70 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-[72px] w-full" />
                <Skeleton className="h-11 w-full rounded-full" />
              </div>
            }
          >
            <LoginFormWithDemoAccounts />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/75 px-4 py-2 text-sm font-medium text-gray-700 shadow-md backdrop-blur-sm">
          <ShieldCheck className="h-4 w-4 text-[#A855F7]" />
          Role-based access with a full audit trail
        </p>
      </div>
    </div>
  );
}
