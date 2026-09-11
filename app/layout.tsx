import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClinicOS - Modern Healthcare Practice Management",
  description:
    "Streamline your healthcare practice with our comprehensive platform. Manage patients, appointments, billing, and records all in one secure, HIPAA-compliant solution.",
  keywords: [
    "healthcare",
    "practice management",
    "electronic health records",
    "EHR",
    "medical software",
    "HIPAA compliant",
    "patient management",
    "medical billing",
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
    url: "https://clinicos.com",
    siteName: "ClinicOS",
    title: "ClinicOS - Modern Healthcare Practice Management",
    description:
      "Comprehensive healthcare practice management platform trusted by 500+ providers.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ClinicOS - Healthcare Practice Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClinicOS - Modern Healthcare Practice Management",
    description:
      "Comprehensive healthcare practice management platform trusted by 500+ providers.",
    images: ["/og-image.png"],
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
