"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle URL error parameter on mount
  useEffect(() => {
    if (urlError) {
      // Map NextAuth error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        Configuration: "Authentication service configuration error. Please contact support.",
        AccessDenied: "Access denied. You don't have permission to sign in.",
        Verification: "Verification token has expired or has already been used.",
        OAuthSignin: "Error starting sign in process.",
        OAuthCallback: "Error during sign in callback.",
        OAuthCreateAccount: "Could not create account.",
        EmailCreateAccount: "Could not create email account.",
        Callback: "Authentication callback error.",
        OAuthAccountNotLinked: "Account already exists with different provider.",
        EmailSignin: "Email sign in error.",
        CredentialsSignin: "Invalid email or password.",
        SessionRequired: "Please sign in to access this page.",
        Default: "Unable to sign in. Please try again.",
      };

      const message = errorMessages[urlError] || errorMessages.Default;
      setError(message);

      // Clear the error from URL to prevent it showing on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        // Map the error to a user-friendly message
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Successful login - redirect
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50/70 backdrop-blur-sm p-3 text-sm text-red-700 shadow-md"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Demo Credentials — tap one to fill the form */}
      <div className="mt-4 rounded-2xl bg-white/50 backdrop-blur-sm p-4 text-xs shadow-md">
        <p className="mb-2 font-medium text-foreground">Demo Credentials:</p>
        <div className="space-y-1.5">
          {[
            ["Provider 1", "dr.smith@clinicos.com", "DrSmith123!"],
            ["Provider 2", "dr.johnson@clinicos.com", "DrJohnson123!"],
            ["Front Desk", "frontdesk@clinicos.com", "FrontDesk123!"],
          ].map(([label, user, pass]) => (
            <button
              key={user}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setEmail(user);
                setPassword(pass);
                setError("");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-muted-foreground transition-colors hover:bg-white/70 hover:text-[#A855F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50 disabled:opacity-50"
            >
              <strong className="shrink-0 text-foreground">{label}:</strong>
              <span className="min-w-0 truncate">{user}</span>
              <span className="shrink-0 text-muted-foreground/60">/</span>
              <code className="shrink-0 font-mono text-foreground/80">{pass}</code>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
