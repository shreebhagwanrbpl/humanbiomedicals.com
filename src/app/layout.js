import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "react-hot-toast";

export const metadata = {
  metadataBase: new URL("https://humanbiomedicals.com"),

  title: {
    default: "Human Biomedicals | Medical, Laboratory & Diagnostic Equipment Supplier",
    template: "%s | Human Biomedicals",
  },

  description:
    "Leading supplier, dealer and distributor of biomedical, laboratory, hospital and diagnostic equipment across India. CBC Machines, Biochemistry Analyzers, Reagents, and 24/7 technical support.",

  keywords: [
    "Biomedical Equipment Supplier",
    "Laboratory Equipment Supplier India",
    "CBC Machine Supplier",
    "Hematology Analyzer",
    "Biochemistry Analyzer Supplier",
    "Diagnostic Equipment Distributor",
    "Hospital Equipment Supplier India",
    "Medical Reagents and Kits",
    "Human Biomedicals",
  ],

  authors: [{ name: "Human Biomedicals", url: "https://humanbiomedicals.com" }],
  creator: "Human Biomedicals",
  publisher: "Human Biomedicals",

  openGraph: {
    title: "Human Biomedicals | Medical, Laboratory & Diagnostic Equipment Supplier",
    description:
      "Leading supplier and distributor of certified biomedical, laboratory and diagnostic instruments across India with PAN-India warranty & maintenance service.",
    url: "https://humanbiomedicals.com",
    siteName: "Human Biomedicals",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Human Biomedicals Equipment",
      },
    ],
    locale: "en_IN",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Human Biomedicals | Medical, Laboratory & Diagnostic Equipment",
    description:
      "Certified diagnostic & laboratory equipment supplier across India. Fast dispatch, warranty and dedicated technical support.",
    images: ["/logo.png"],
  },

  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  alternates: {
    canonical: "https://humanbiomedicals.com",
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

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  name: "Human Biomedicals",
  url: "https://humanbiomedicals.com",
  logo: "https://humanbiomedicals.com/logo.png",
  description:
    "Leading supplier, dealer and distributor of biomedical, diagnostic, laboratory and healthcare equipment in India.",
  address: {
    "@type": "PostalAddress",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support & Sales",
    availableLanguage: ["English", "Hindi"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Human Biomedicals",
  url: "https://humanbiomedicals.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://humanbiomedicals.com/items?category={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased variant-16 font-sans bg-slate-50 text-slate-800" data-ui-variant="aqua" suppressHydrationWarning>
        <Navbar />

        <main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#ffffff",
                color: "#12383a",
                border: "1px solid #bfe8ea",
                fontWeight: "600",
                fontSize: "14px",
              },
            }}
          />

          {children}
        </main>

        <Footer />
        <ScrollToTop />
      </body>
    </html>
  );
}