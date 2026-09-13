import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Play } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center rounded-full bg-white/50 backdrop-blur-sm px-4 py-1.5 text-sm shadow-lg animate-in fade-in slide-in-from-top-3 duration-700">
            <CheckCircle className="mr-2 h-4 w-4 text-[#A855F7]" />
            Healthcare practice management prototype
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            Modern Healthcare
            <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-300 bg-clip-text text-transparent animate-gradient">
              Practice Management
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Streamline your healthcare practice with our comprehensive platform.
            Manage patients, appointments, billing, and records all in one
            secure, HIPAA-oriented platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <Button size="lg" asChild className="w-full md:w-auto shadow-lg group">
              <Link href="/login" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full md:w-auto bg-white/50 backdrop-blur-sm shadow-lg group"
            >
              <Link href="#demo" className="flex items-center">
                <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" fill="currentColor" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-default">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">HIPAA-Oriented</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-default">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">Full Audit Trail</span>
            </div>
            <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-default">
              <CheckCircle className="h-5 w-5 text-[#A855F7]" />
              <span className="text-sm font-medium">Provider Data Isolation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
