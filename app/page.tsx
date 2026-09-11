import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CTA } from "@/components/landing/cta";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen">
      {/* Elegant Continuous Gradient Background */}
      <div className="fixed inset-0 -z-10">
        {/* Main gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50" />
        
        {/* Animated gradient orbs with vibrant blue glow */}
        <div className="absolute top-0 -left-4 w-[500px] h-[500px] bg-purple-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ boxShadow: '0 0 100px rgba(192, 132, 252, 0.25)' }} />
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-fuchsia-200/35 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '2s', animationDuration: '7s', boxShadow: '0 0 120px rgba(216, 180, 254, 0.25)' }} />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-purple-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '4s', animationDuration: '9s', boxShadow: '0 0 100px rgba(165, 180, 252, 0.25)' }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-purple-200/25 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" style={{ animationDelay: '6s', animationDuration: '8s', boxShadow: '0 0 80px rgba(192, 132, 252, 0.2)' }} />
        
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxwYXRoIGQ9Ik0wIDBoMzAwdjMwMEgweiIgZmlsdGVyPSJ1cmwoI2EpIiBvcGFjaXR5PSIuMDUiLz48L3N2Zz4=')] opacity-30" />
      </div>

      <Hero />
      <Features />
      
      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12 md:mb-16">
            <div className="mb-4 inline-flex items-center rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm bg-white/50 backdrop-blur-sm shadow-md">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="font-semibold">Flexible Plans</span>
            </div>
            <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed px-4 sm:px-0">
              Choose the plan that fits your practice size. All plans include HIPAA compliance and 24/7 support.
            </p>
          </div>
          
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="group relative rounded-3xl bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-lg transition-all hover:shadow-2xl hover:scale-105">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Starter</h3>
                <p className="text-sm sm:text-base text-muted-foreground">Perfect for small practices</p>
              </div>
              
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">$99</span>
                  <span className="text-base sm:text-lg text-muted-foreground">/month</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">Billed monthly</p>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Up to 2 providers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">500 active patients</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Basic reporting & analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Email support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">HIPAA compliant</span>
                </li>
              </ul>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
            
            {/* Professional Plan - Featured */}
            <div className="group relative rounded-3xl bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all hover:shadow-3xl hover:scale-105 md:col-span-2 lg:col-span-1">
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-400 to-purple-500 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                Most Popular
              </div>
              
              <div className="mb-6 sm:mb-8 mt-2">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Professional</h3>
                <p className="text-sm sm:text-base text-muted-foreground">For growing practices</p>
              </div>
              
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">$249</span>
                  <span className="text-base sm:text-lg text-muted-foreground">/month</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">Billed monthly</p>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">Up to 10 providers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">Unlimited patients</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">Advanced analytics & insights</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">Priority phone & email support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium">API access & integrations</span>
                </li>
              </ul>
              
              <Button className="w-full" asChild>
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
            
            {/* Enterprise Plan */}
            <div className="group relative rounded-3xl bg-white/70 backdrop-blur-xl p-6 sm:p-8 shadow-lg transition-all hover:shadow-2xl hover:scale-105 md:col-span-2 lg:col-span-1">
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Enterprise</h3>
                <p className="text-sm sm:text-base text-muted-foreground">For large organizations</p>
              </div>
              
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold tracking-tight">Custom</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">Contact sales for pricing</p>
              </div>
              
              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Unlimited providers</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Unlimited patients & storage</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Custom integrations & features</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-3 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm sm:text-base">24/7 phone support & SLA</span>
                </li>
              </ul>
              
              <Button className="w-full" variant="outline" asChild>
                <Link href="#contact">Contact Sales</Link>
              </Button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 sm:mt-16 text-center px-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Trusted by 500+ healthcare practices nationwide</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 opacity-60">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">30-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="text-center mb-12 sm:mb-16">
              <div className="mb-4 inline-flex items-center rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm bg-white/50 backdrop-blur-sm shadow-md">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Our Story
              </div>
              <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                About ClinicOS
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
                Built by healthcare professionals, for healthcare professionals
              </p>
            </div>
            
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16">
              {/* Left: Mission Statement */}
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute -left-2 sm:-left-4 top-0 w-0.5 sm:w-1 h-full bg-gradient-to-b from-purple-400 to-purple-500 rounded-full" />
                  <div className="pl-6 sm:pl-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Our Mission</h3>
                    <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                      ClinicOS was founded in 2024 with a clear mission: to modernize healthcare practice management. 
                      We believe healthcare providers should spend more time caring for patients and less time dealing 
                      with administrative complexity.
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg">
                  <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">What We Do</h4>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Our platform combines cutting-edge technology with deep healthcare expertise to deliver a solution 
                    that is both powerful and intuitive. From smart scheduling to comprehensive EHR and automated billing, 
                    we help practices of all sizes improve efficiency and patient outcomes.
                  </p>
                </div>
              </div>

              {/* Right: Key Stats */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <div className="text-3xl sm:text-4xl font-bold text-purple-500 mb-2">500+</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Healthcare Providers</p>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <div className="text-3xl sm:text-4xl font-bold text-purple-500 mb-2">2024</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Year Founded</p>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                    <div className="text-4xl font-bold text-purple-500 mb-2">1M+</div>
                    <p className="text-sm text-muted-foreground">Appointments Managed</p>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-6 shadow-lg  hover:shadow-xl transition-all hover:scale-105">
                    <div className="text-4xl font-bold text-purple-500 mb-2">99.9%</div>
                    <p className="text-sm text-muted-foreground">Uptime Guarantee</p>
                  </div>
                </div>

                <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg">
                  <h4 className="font-bold text-lg mb-4">Our Impact</h4>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Today, ClinicOS serves healthcare providers across the country, managing millions of patient 
                    appointments and records securely and efficiently. Our customers report:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">40% reduction in administrative time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">25% increase in patient satisfaction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm">30% fewer no-show appointments</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Core Values */}
            <div className="mb-16">
              <h3 className="text-2xl font-bold text-center mb-10">Our Core Values</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg group- group-hover:shadow-xl transition-all">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-3">Security First</h4>
                    <p className="text-muted-foreground">
                      Patient data security is our top priority. We maintain HIPAA compliance and use industry-leading 
                      encryption to protect sensitive information.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg group- group-hover:shadow-xl transition-all">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-3">Innovation</h4>
                    <p className="text-muted-foreground">
                      We continuously evolve our platform with the latest technology, ensuring our customers always 
                      have access to cutting-edge features.
                    </p>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-400/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-lg group- group-hover:shadow-xl transition-all">
                    <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold mb-3">Patient-Centered</h4>
                    <p className="text-muted-foreground">
                      Every feature we build is designed to improve patient care and outcomes. We believe better 
                      software leads to better healthcare.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team/Trust Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-400 to-purple-500 p-12 text-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="h-full w-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
              </div>
              
              <div className="relative max-w-3xl mx-auto">
                <h3 className="text-3xl font-bold text-white mb-4">
                  Join Healthcare Providers Who Trust ClinicOS
                </h3>
                <p className="text-lg text-white/90 mb-8">
                  From solo practitioners to large medical groups, practices across the country rely on ClinicOS 
                  to streamline their operations and deliver exceptional patient care.
                </p>
                <Button size="lg" variant="secondary" asChild className="bg-white text-purple-500 hover:bg-white/90">
                  <Link href="/login" className="flex items-center">
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <div className="mb-4 inline-flex items-center rounded-full px-5 py-2 text-sm bg-white/50 backdrop-blur-sm shadow-md">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              We&apos;re Here to Help
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions? Our team is here to help you get started with ClinicOS.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-12">
            {/* Sales Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg transition-all  hover:shadow-2xl hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10/50 rounded-full -mr-16 -mt-16" />
              
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-400/10 text-purple-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Sales Inquiries</h3>
                <p className="text-muted-foreground mb-6">
                  Interested in ClinicOS for your practice? Our sales team can help you find the perfect plan and answer all your questions.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 mb-1">Email us</p>
                      <a href="mailto:mainak.lnmiit@gmail.com" className="text-lg font-semibold text-purple-500 hover:text-purple-500 transition-colors">
                        mainak.lnmiit@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/login" className="flex items-center justify-center">
                        Schedule a Demo
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Support Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg transition-all  hover:shadow-2xl hover:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10/50 rounded-full -mr-16 -mt-16" />
              
              <div className="relative">
                <div className="mb-6 inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-400/10 text-purple-500">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Customer Support</h3>
                <p className="text-muted-foreground mb-6">
                  Need help with your account? Our support team is available 24/7 to assist you with any technical issues.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="font-semibold text-sm text-gray-500 mb-1">Email us</p>
                      <a href="mailto:mainak.lnmiit@gmail.com" className="text-lg font-semibold text-purple-500 hover:text-purple-500 transition-colors">
                        mainak.lnmiit@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-400/5 rounded-lg">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold">Response time</p>
                      <p className="text-sm text-muted-foreground">Usually within 12 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Contact Options */}
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Looking for something else?</h3>
                <p className="text-muted-foreground">We&apos;re here to help with any questions you may have</p>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-4">
                  <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-1">Documentation</h4>
                  <p className="text-sm text-muted-foreground">Browse our guides</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-1">Community</h4>
                  <p className="text-sm text-muted-foreground">Join the discussion</p>
                </div>
                
                <div className="text-center p-4">
                  <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="font-semibold mb-1">Resources</h4>
                  <p className="text-sm text-muted-foreground">Learn more about ClinicOS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                See ClinicOS in Action
              </h2>
              <p className="text-lg text-muted-foreground">
                Try our demo environment with sample data to explore all features. Login with any of these demo accounts.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {/* Front Desk Account */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg transition-all  hover:shadow-2xl hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Front Desk Staff</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage appointments, patients, and schedules across all providers
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">EMAIL</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500 break-all">
                          frontdesk@clinicos.com
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">PASSWORD</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500">
                          FrontDesk123!
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Full system access
                  </div>
                </div>
              </div>

              {/* Provider 1: Dr. Smith */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg transition-all  hover:shadow-2xl hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Dr. Sarah Smith</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Family Medicine provider with full patient care capabilities
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">EMAIL</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500 break-all">
                          dr.smith@clinicos.com
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">PASSWORD</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500">
                          DrSmith123!
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Provider dashboard access
                  </div>
                </div>
              </div>

              {/* Provider 2: Dr. Johnson */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-xl p-8 shadow-lg transition-all  hover:shadow-2xl hover:scale-105">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full -mr-16 -mt-16 opacity-50" />
                
                <div className="relative">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-400/10 text-purple-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-gray-900">Dr. Michael Johnson</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Internal Medicine provider with patient management features
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">EMAIL</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500 break-all">
                          dr.johnson@clinicos.com
                        </code>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs font-semibold text-gray-500 w-20 mt-0.5">PASSWORD</span>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-purple-400/5 px-2 py-1 rounded text-purple-500">
                          DrJohnson123!
                        </code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <svg className="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Provider dashboard access
                  </div>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="mt-8 mx-auto max-w-4xl">
              <div className="rounded-3xl bg-white/70 backdrop-blur-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">Demo Environment Information</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• All demo accounts have access to sample patient data and appointments</li>
                      <li>• Front Desk can view and manage appointments for all providers</li>
                      <li>• Providers can only access their own appointments and patients</li>
                      <li>• Data resets daily - feel free to explore all features</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 text-center">
              <Button size="lg" asChild className="w-full md:w-auto">
                <Link href="/login" className="flex items-center">
                  Try Demo Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <CTA />
      </div>

      {/* Footer */}
      <footer className="py-8 px-4">
        <div className="container mx-auto flex justify-center">
          <div className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/70 backdrop-blur-xl shadow-lg">
            <p className="text-sm text-gray-600">
              © 2026 ClinicOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
