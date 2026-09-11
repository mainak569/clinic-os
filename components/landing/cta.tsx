import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import Link from "next/link";

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 px-8 py-16 text-center md:px-16 md:py-24">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
            </div>

            <div className="relative">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/10 p-3">
                <Heart className="h-8 w-8 text-white" />
              </div>

              {/* Headline */}
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                Ready to Transform Your Practice?
              </h2>

              {/* Subheadline */}
              <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
                Join thousands of healthcare providers who trust ClinicOS to
                streamline their operations and improve patient care. Start your
                free trial today.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="w-full bg-white text-primary hover:bg-white/90 md:w-auto"
                >
                  <Link href="/signup" className="flex items-center">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 md:w-auto"
                >
                  <Link href="#contact">Talk to Sales</Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
                <div>- No setup fees</div>
                <div>- 30-day free trial</div>
                <div>- Cancel anytime</div>
                <div>- HIPAA compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
