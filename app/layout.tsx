import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  // Resolves relative social-card URLs; AUTH_URL is the app's own URL.
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
  title: "ClinicOS - Modern Healthcare Practice Management",
  description:
    "Streamline your healthcare practice. Manage patients, appointments, provider schedules and visit notes in one HIPAA-oriented platform.",
  keywords: [
    "healthcare",
    "practice management",
    "appointment scheduling",
    "visit notes",
    "medical software",
    "HIPAA-oriented",
    "patient management",
  ],
  authors: [{ name: "ClinicOS Team" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ClinicOS",
    title: "ClinicOS - Modern Healthcare Practice Management",
    description:
      "Healthcare practice management prototype: scheduling, patient records and visit notes.",
  },
  twitter: {
    card: "summary",
    title: "ClinicOS - Modern Healthcare Practice Management",
    description:
      "Healthcare practice management prototype: scheduling, patient records and visit notes.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <QueryProvider>
            <div className="relative flex min-h-screen flex-col">
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
