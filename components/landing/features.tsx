import {
  Calendar,
  FileText,
  Shield,
  Users,
  CreditCard,
  BarChart3,
  Clock,
  Heart,
  Stethoscope,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    name: "Patient Management",
    description:
      "Comprehensive patient records, medical history, and contact management in one secure platform.",
    icon: Users,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    name: "Appointment Scheduling",
    description:
      "Smart scheduling system with automated reminders, calendar integration, and waitlist management.",
    icon: Calendar,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Electronic Health Records",
    description:
      "Digital patient charts with customizable templates, e-prescriptions, and clinical decision support.",
    icon: FileText,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    name: "Billing & Payments",
    description:
      "Automated billing, insurance claims processing, and integrated payment solutions.",
    icon: CreditCard,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    name: "Healthcare Security",
    description:
      "Role-based access, provider data isolation, and an immutable audit trail for patient data.",
    icon: Shield,
    color: "red",
    gradient: "from-red-500 to-rose-500",
  },
  {
    name: "Analytics & Reporting",
    description:
      "Real-time insights into practice performance, patient outcomes, and financial metrics.",
    icon: BarChart3,
    color: "indigo",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    name: "Telemedicine Ready",
    description:
      "Built-in video consultations with secure messaging and remote patient monitoring.",
    icon: Stethoscope,
    color: "teal",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    name: "Appointment Reminders",
    description:
      "Alerts for unconfirmed appointments 24 hours and 1 hour before they start.",
    icon: Clock,
    color: "violet",
    gradient: "from-violet-500 to-purple-500",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/50 px-4 py-2 shadow-md backdrop-blur-sm">
            <Sparkles className="h-4 w-4 animate-pulse text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">
              Everything you need
            </span>
          </div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Complete Healthcare
            <span className="block bg-gradient-to-r from-purple-700 to-fuchsia-600 bg-clip-text text-transparent">
              Practice Solution
            </span>
          </h2>

          <p className="text-xl leading-relaxed text-muted-foreground">
            From patient intake to billing, ClinicOS provides all the tools you
            need to run a modern healthcare practice efficiently and securely.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="group relative">
                {/* Glow Effect */}
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 blur-lg transition duration-500 group-hover:opacity-20`}
                />

                {/* Card */}
                <div className="relative h-full rounded-2xl border border-white/60 bg-white/70 p-8 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                  {/* Icon Container: glass tile over a gradient backing, tilts in on hover */}
                  <div className="relative mb-6 h-16 w-16 [perspective:24em] [transform-style:preserve-3d]">
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg transition-transform duration-300 [transition-timing-function:cubic-bezier(0.83,0,0.17,1)] [will-change:transform] group-hover:[transform:rotate(8deg)_translate3d(-0.2em,-0.2em,0)]`}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)] backdrop-blur-md transition-transform duration-300 [transition-timing-function:cubic-bezier(0.83,0,0.17,1)] [will-change:transform] group-hover:[transform:translate3d(0,0,0.5em)_scale(1.05)]"
                    >
                      <feature.icon className="h-7 w-7 text-white drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent">
                      {feature.name}
                    </h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="mt-6 flex items-center text-sm font-semibold text-purple-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Corner Accent */}
                  <div
                    className={`absolute right-0 top-0 h-24 w-24 bg-gradient-to-br ${feature.gradient} rounded-bl-full rounded-tr-2xl opacity-5 transition-opacity group-hover:opacity-10`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col items-center gap-4 rounded-3xl bg-white/50 p-8 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Heart className="h-4 w-4 animate-pulse text-red-500" />
              Built for modern practices
            </div>
            <p className="max-w-md text-lg font-medium">
              Scheduling, documentation and follow-up in one place
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
