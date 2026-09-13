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
    bgGradient: "from-blue-50 to-cyan-50",
  },
  {
    name: "Appointment Scheduling",
    description:
      "Smart scheduling system with automated reminders, calendar integration, and waitlist management.",
    icon: Calendar,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50",
  },
  {
    name: "Electronic Health Records",
    description:
      "Digital patient charts with customizable templates, e-prescriptions, and clinical decision support.",
    icon: FileText,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50",
  },
  {
    name: "Billing & Payments",
    description:
      "Automated billing, insurance claims processing, and integrated payment solutions.",
    icon: CreditCard,
    color: "orange",
    gradient: "from-orange-500 to-amber-500",
    bgGradient: "from-orange-50 to-amber-50",
  },
  {
    name: "HIPAA-Oriented Security",
    description:
      "Role-based access, provider data isolation, and an immutable audit trail for patient data.",
    icon: Shield,
    color: "red",
    gradient: "from-red-500 to-rose-500",
    bgGradient: "from-red-50 to-rose-50",
  },
  {
    name: "Analytics & Reporting",
    description:
      "Real-time insights into practice performance, patient outcomes, and financial metrics.",
    icon: BarChart3,
    color: "indigo",
    gradient: "from-indigo-500 to-blue-500",
    bgGradient: "from-indigo-50 to-blue-50",
  },
  {
    name: "Telemedicine Ready",
    description:
      "Built-in video consultations with secure messaging and remote patient monitoring.",
    icon: Stethoscope,
    color: "teal",
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50",
  },
  {
    name: "Appointment Reminders",
    description:
      "Alerts for unconfirmed appointments 24 hours and 1 hour before they start.",
    icon: Clock,
    color: "violet",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/50 backdrop-blur-sm px-4 py-2 shadow-md">
            <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            <span className="text-sm font-semibold text-purple-400">
              Everything you need
            </span>
          </div>
          
          <h2 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Complete Healthcare
            <span className="block bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
              Practice Solution
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            From patient intake to billing, ClinicOS provides all the tools you
            need to run a modern healthcare practice efficiently and securely.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative"
              >
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-lg transition duration-500`} />
                
                {/* Card */}
                <div className="relative h-full rounded-2xl bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  {/* Icon Container */}
                  <div className={`mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.bgGradient} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold tracking-tight group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-purple-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                      {feature.name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="mt-6 flex items-center text-sm font-semibold text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>

                  {/* Corner Accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full rounded-tr-2xl transition-opacity group-hover:opacity-10`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col items-center gap-4 rounded-3xl bg-white/50 backdrop-blur-sm p-8 shadow-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Heart className="h-4 w-4 text-red-500 animate-pulse" />
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
