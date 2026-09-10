import { LoginForm } from "@/components/auth/login-form";
import { Heart } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Login - ClinicOS",
  description: "Sign in to your ClinicOS account",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="mb-8 flex items-center justify-center space-x-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">ClinicOS</span>
        </Link>

        {/* Login Card */}
        <div className="rounded-lg border bg-card p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Protected by enterprise-grade security
        </p>
      </div>
    </div>
  );
}
