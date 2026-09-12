import { LoginForm } from "@/components/auth/login-form";
import { GlassBackground } from "@/components/layout/glass-background";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In - ClinicOS",
  description: "Sign in to your ClinicOS account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {/* Same background as the home page, from one shared component */}
      <GlassBackground />

      <Link
        href="/"
        className="absolute left-4 top-6 flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-xl px-4 py-2 text-sm font-medium text-gray-700 shadow-lg transition-all hover:bg-white/80 hover:text-[#A855F7] hover:shadow-xl sm:left-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center justify-center space-x-2 rounded-full bg-white/70 backdrop-blur-xl px-6 py-3 shadow-lg transition-all hover:shadow-xl"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#A855F7] shadow-md">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#A855F7]">ClinicOS</span>
        </Link>

        {/* Login Card */}
        <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-2xl">
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
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-white/50 backdrop-blur-sm px-4 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-[#A855F7]" />
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
