import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { CTA } from "@/components/landing/cta";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github, Mail } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { MoltenBackground } from "@/components/layout/molten-background";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <div className="relative min-h-screen">
        {/* Animated molten background (landing and login pages only) */}
        <MoltenBackground />

        <Hero />
        <Features />

        {/* About Section */}
        <section id="about" className="py-16 md:py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              {/* Header */}
              <div className="mb-12 text-center sm:mb-16">
                <div className="mb-4 inline-flex items-center rounded-full bg-white/50 px-4 py-2 text-xs shadow-md backdrop-blur-sm sm:px-5 sm:text-sm">
                  <svg
                    className="mr-2 h-4 w-4 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  About
                </div>
                <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
                  About ClinicOS
                </h2>
                <p className="mx-auto max-w-2xl px-4 text-base text-muted-foreground sm:px-0 sm:text-lg">
                  A clinic management prototype built around secure, role-based
                  workflows
                </p>
              </div>

              {/* Main Content Grid */}
              <div className="mb-12 grid gap-8 sm:mb-16 sm:gap-12 lg:grid-cols-2">
                {/* Left: Mission Statement */}
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute -left-2 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-purple-400 to-purple-500 sm:-left-4 sm:w-1" />
                    <div className="pl-6 sm:pl-8">
                      <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">
                        What ClinicOS Is
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                        ClinicOS is a clinic appointment and practice management
                        prototype. It brings appointments, provider schedules,
                        patient records and visit notes into one app, for two
                        roles: front desk staff and providers.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/70 p-6 shadow-lg backdrop-blur-xl sm:rounded-3xl sm:p-8">
                    <h4 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg">
                      What It Does
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      Front desk staff book and manage appointments across
                      providers, with clash detection and working-hours checks.
                      Providers see their own schedule and patients, write SOAP
                      visit notes with a full edit history, and get alerts for
                      unconfirmed visits. Every change is recorded in an audit
                      log.
                    </p>
                  </div>
                </div>

                {/* Right: Key Stats */}
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="rounded-2xl bg-white/70 p-4 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl sm:rounded-3xl sm:p-6">
                      <div className="mb-2 text-3xl font-bold text-purple-500 sm:text-4xl">
                        6
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        Appointment States
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/70 p-4 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl sm:rounded-3xl sm:p-6">
                      <div className="mb-2 text-3xl font-bold text-purple-500 sm:text-4xl">
                        2
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        User Roles
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/70 p-4 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-xl sm:rounded-3xl sm:p-6">
                      <div className="mb-2 text-4xl font-bold text-purple-500">
                        11
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Data Models
                      </p>
                    </div>

                    <div className="rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur-xl  transition-all hover:scale-105 hover:shadow-xl">
                      <div className="mb-2 text-4xl font-bold text-purple-500">
                        SOAP
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Visit Notes
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl">
                    <h4 className="mb-4 text-lg font-bold">
                      Built to Be Reliable
                    </h4>
                    <p className="mb-4 leading-relaxed text-muted-foreground">
                      Each of these is covered by automated tests that run
                      against a real database:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm">
                          No double-bookings, even with simultaneous requests
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm">
                          Bookings checked against each provider&apos;s working
                          hours
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm">
                          Providers see only their own patients and appointments
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Core Values */}
              <div className="mb-16">
                <h3 className="mb-10 text-center text-2xl font-bold">
                  Design Principles
                </h3>
                <div className="grid gap-8 md:grid-cols-3">
                  <div className="group relative">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-400/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="group- relative rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all group-hover:shadow-xl">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                      </div>
                      <h4 className="mb-3 text-xl font-bold">Security First</h4>
                      <p className="text-muted-foreground">
                        Access to patient data depends on role, providers only
                        see their own patients, and every change is written to
                        an audit trail.
                      </p>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-400/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="group- relative rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all group-hover:shadow-xl">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <h4 className="mb-3 text-xl font-bold">
                        Accurate Scheduling
                      </h4>
                      <p className="text-muted-foreground">
                        Bookings are checked against each provider&apos;s hours
                        and existing visits on the clinic&apos;s local time, so
                        an open slot can be booked and a clash is refused.
                      </p>
                    </div>
                  </div>

                  <div className="group relative">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 to-purple-400/10 opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="group- relative rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all group-hover:shadow-xl">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="mb-3 text-xl font-bold">
                        Complete Records
                      </h4>
                      <p className="text-muted-foreground">
                        SOAP visit notes with range-checked vital signs, and a
                        history of every note edit and appointment status
                        change.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full bg-white/50 px-5 py-2 text-sm shadow-md backdrop-blur-sm">
                <Mail className="mr-2 h-4 w-4 text-purple-500" />
                Contact
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Get in Touch
              </h2>
              <p className="text-lg text-muted-foreground">
                Questions or feedback about ClinicOS? Send an email, or read the
                source code on GitHub.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
              {/* Email Card */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-2xl">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                  <Mail className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Email</h3>
                <p className="mb-4 text-muted-foreground">
                  For questions, feedback or bug reports.
                </p>
                <a
                  href="mailto:mainak.lnmiit@gmail.com"
                  className="break-all text-lg font-semibold text-purple-500 transition-colors hover:text-purple-600"
                >
                  mainak.lnmiit@gmail.com
                </a>
              </div>

              {/* Source Code Card */}
              <div className="group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all hover:scale-105 hover:shadow-2xl">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                  <Github className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Source Code</h3>
                <p className="mb-4 text-muted-foreground">
                  The code, architecture notes and design decisions behind
                  ClinicOS.
                </p>
                <a
                  href="https://github.com/mainak569/clinic-os"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center break-all text-lg font-semibold text-purple-500 transition-colors hover:text-purple-600"
                >
                  github.com/mainak569/clinic-os
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                  See ClinicOS in Action
                </h2>
                <p className="text-lg text-muted-foreground">
                  Try our demo environment with sample data to explore all
                  features. Login with any of these demo accounts.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Front Desk Account */}
                <div className="group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all  hover:scale-105 hover:shadow-2xl">
                  <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-purple-400/10 opacity-50" />

                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      Front Desk Staff
                    </h3>
                    <p className="mb-6 text-sm text-gray-600">
                      Manage appointments, patients, and schedules across all
                      providers
                    </p>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          EMAIL
                        </span>
                        <div className="flex-1">
                          <code className="break-all rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            frontdesk@clinicos.com
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          PASSWORD
                        </span>
                        <div className="flex-1">
                          <code className="rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            FrontDesk123!
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="mr-1 h-4 w-4 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Full system access
                    </div>
                  </div>
                </div>

                {/* Provider 1: Dr. Smith */}
                <div className="group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all  hover:scale-105 hover:shadow-2xl">
                  <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-purple-400/10 opacity-50" />

                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      Dr. Sarah Smith
                    </h3>
                    <p className="mb-6 text-sm text-gray-600">
                      Family Medicine provider with full patient care
                      capabilities
                    </p>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          EMAIL
                        </span>
                        <div className="flex-1">
                          <code className="break-all rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            dr.smith@clinicos.com
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          PASSWORD
                        </span>
                        <div className="flex-1">
                          <code className="rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            DrSmith123!
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="mr-1 h-4 w-4 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Provider dashboard access
                    </div>
                  </div>
                </div>

                {/* Provider 2: Dr. Johnson */}
                <div className="group relative overflow-hidden rounded-3xl bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all  hover:scale-105 hover:shadow-2xl">
                  <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-purple-400/10 opacity-50" />

                  <div className="relative">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-400/10 text-purple-500">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-gray-900">
                      Dr. Michael Johnson
                    </h3>
                    <p className="mb-6 text-sm text-gray-600">
                      Internal Medicine provider with patient management
                      features
                    </p>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          EMAIL
                        </span>
                        <div className="flex-1">
                          <code className="break-all rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            dr.johnson@clinicos.com
                          </code>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <span className="mt-0.5 w-20 text-xs font-semibold text-gray-500">
                          PASSWORD
                        </span>
                        <div className="flex-1">
                          <code className="rounded bg-purple-400/5 px-2 py-1 font-mono text-sm text-purple-500">
                            DrJohnson123!
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <svg
                        className="mr-1 h-4 w-4 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Provider dashboard access
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="mx-auto mt-8 max-w-4xl">
                <div className="rounded-3xl bg-white/70 p-6 shadow-lg backdrop-blur-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-purple-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="mb-2 font-semibold text-gray-900">
                        Demo Environment Information
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>
                          • All demo accounts have access to sample patient data
                          and appointments
                        </li>
                        <li>
                          • Front Desk can view and manage appointments for all
                          providers
                        </li>
                        <li>
                          • Providers can only access their own appointments and
                          patients
                        </li>
                        <li>
                          • This is a shared demo, so please don&apos;t enter
                          real patient information
                        </li>
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
      <footer className="px-4 py-8">
        <div className="container mx-auto flex justify-center">
          <div className="inline-flex items-center justify-center rounded-full bg-white/70 px-6 py-3 shadow-lg backdrop-blur-xl">
            <p className="text-sm text-gray-600">
              © 2026 ClinicOS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
