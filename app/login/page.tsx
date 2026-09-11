import { LoginForm } from "@/components/auth/login-form";
import { Heart } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Login - ClinicOS",
  description: "Sign in to your ClinicOS account",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background with glass effect */}
      <div className="fixed inset-0 -z-10">
        {/* Main gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" />
        
        {/* Animated gradient orbs with vibrant blue glow */}
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ boxShadow: '0 0 100px rgba(192, 132, 252, 0.25)' }} />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-fuchsia-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s', animationDuration: '7s', boxShadow: '0 0 120px rgba(216, 180, 254, 0.25)' }} />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center space-x-2 px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all mx-auto w-fit"
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

          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-sm text-muted-foreground bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full w-fit mx-auto">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
