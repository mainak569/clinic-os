import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MoltenBackground } from "@/components/layout/molten-background";

export const metadata = {
  title: "Page Not Found - ClinicOS",
  description: "The page you're looking for doesn't exist or may have been moved.",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <MoltenBackground />

      <div className="w-full max-w-md rounded-3xl bg-white/70 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#A855F7]/10 p-6">
            <Compass className="h-12 w-12 text-[#A855F7]" />
          </div>
        </div>

        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-[#A855F7]">
          404
        </p>
        <h1 className="mb-2 text-3xl font-bold">Page Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist, may have been
          moved, or the link might be out of date.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">Go to Homepage</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
