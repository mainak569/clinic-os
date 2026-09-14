import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Users } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-white/50 px-4 py-1.5 text-sm shadow-lg backdrop-blur-sm duration-700 animate-in fade-in slide-in-from-top-3">
            <CheckCircle className="mr-2 h-4 w-4 text-[#A855F7]" />
            Healthcare practice management prototype
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight delay-100 duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-6xl lg:text-7xl">
            Modern Healthcare
            <span className="animate-gradient -mb-[0.15em] block bg-gradient-to-r from-purple-700 via-fuchsia-600 to-purple-600 bg-clip-text pb-[0.15em] text-transparent">
              Practice Management
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground delay-200 duration-700 animate-in fade-in slide-in-from-bottom-4 md:text-xl">
            Manage patients, appointments, provider schedules and visit notes in
            one app, with role-based access and a full audit trail.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 delay-300 duration-700 animate-in fade-in slide-in-from-bottom-4 md:flex-row">
            <Button
              size="lg"
              asChild
              className="group w-full shadow-lg md:w-auto"
            >
              <Link href="/login" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="group w-full bg-white/50 shadow-lg backdrop-blur-sm md:w-auto"
            >
              <Link href="#demo" className="flex items-center">
                <Users className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Demo Accounts
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 delay-500 duration-700 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex cursor-default items-center gap-2 rounded-full bg-white/50 px-4 py-2.5 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">Role-Based Access</span>
            </div>
            <div className="flex cursor-default items-center gap-2 rounded-full bg-white/50 px-4 py-2.5 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">Full Audit Trail</span>
            </div>
            <div className="flex cursor-default items-center gap-2 rounded-full bg-white/50 px-4 py-2.5 shadow-md backdrop-blur-sm transition-all hover:scale-105 hover:shadow-lg">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">
                Provider Data Isolation
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
