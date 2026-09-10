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
} from "lucide-react";

const features = [
  {
    name: "Patient Management",
    description:
      "Comprehensive patient records, medical history, and contact management in one secure platform.",
    icon: Users,
  },
  {
    name: "Appointment Scheduling",
    description:
      "Smart scheduling system with automated reminders, calendar integration, and waitlist management.",
    icon: Calendar,
  },
  {
    name: "Electronic Health Records",
    description:
      "Digital patient charts with customizable templates, e-prescriptions, and clinical decision support.",
    icon: FileText,
  },
  {
    name: "Billing & Payments",
    description:
      "Automated billing, insurance claims processing, and integrated payment solutions.",
    icon: CreditCard,
  },
  {
    name: "HIPAA Compliance",
    description:
      "End-to-end encryption, audit trails, and compliance monitoring to protect patient data.",
    icon: Shield,
  },
  {
    name: "Analytics & Reporting",
    description:
      "Real-time insights into practice performance, patient outcomes, and financial metrics.",
    icon: BarChart3,
  },
  {
    name: "Telemedicine Ready",
    description:
      "Built-in video consultations with secure messaging and remote patient monitoring.",
    icon: Stethoscope,
  },
  {
    name: "24/7 Support",
    description:
      "Round-the-clock technical support with healthcare IT specialists and training resources.",
    icon: Clock,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border px-4 py-1.5 text-sm">
            <Heart className="mr-2 h-4 w-4 text-primary" />
            Everything you need
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Complete Healthcare Practice Solution
          </h2>
          <p className="text-lg text-muted-foreground">
            From patient intake to billing, ClinicOS provides all the tools you
            need to run a modern healthcare practice efficiently and securely.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="relative rounded-lg border bg-card p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.name}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
