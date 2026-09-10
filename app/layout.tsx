import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

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
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-8">
            <div className="container mx-auto px-4 text-center text-muted-foreground">
              <p>
                © 2026 ClinicOS. All rights reserved. Built with modern
                healthcare in mind.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
