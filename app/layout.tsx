import "./globals.css";

import Footer from "./components/Footer";
import { cookies } from "next/headers";
import Navbar from "./components/Navbar";
import { UserProvider } from "./context/UserContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { ToastProvider } from "./context/ToastContext";
import LayoutContentClient from "./components/LayoutContentClient";
import { StructuredData } from "./components/StructuredData";
import type { Metadata, Viewport } from "next";
import { Source_Serif_4 } from "next/font/google";

// ISR Global
export const revalidate = 1800;

// Cambiar cuando tengas el dominio definitivo
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://artdesignmakr.com";

const SITE_NAME = "Art Design MAKR | Cuadros Pintados a Mano Quito Ecuador";

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-source-serif-4",
});

export const metadata: Metadata = {
  title: {
    default: "Art Design MAKR | Cuadros Pintados a Mano en Quito",
    template: "%s | Art Design MAKR",
  },

  description:
    "Cuadros 100% pintados a mano, personalizados en medida y diseño. Más de 15 años de trayectoria y experiencia en arte decorativo. Trabajamos bajo pedido con envío a todo el Ecuador desde Quito.",

  keywords: [
    "cuadros pintados a mano",
    "cuadros personalizados Ecuador",
    "cuadros a medida Quito",
    "arte decorativo Ecuador",
    "pinturas al óleo Ecuador",
    "cuadros grandes para sala",
    "decoración con cuadros",
    "arte para el hogar Quito",
    "Art Design MAKR",
    "cuadros abstractos Ecuador",
    "murales pintados a mano",
    "regalos de arte personalizados",
  ],

  creator: SITE_NAME,

  publisher: SITE_NAME,

  metadataBase: new URL(SITE_URL),

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "es_EC",
    url: SITE_URL,
    siteName: SITE_NAME,

    title: "Art Design MAKR | Cuadros Pintados a Mano",

    description:
      "Cuadros 100% pintados a mano, con medidas y diseños personalizados. Trabajamos bajo pedido y hacemos envíos a todo el país desde Quito, Ecuador.",

    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Art Design MAKR - Cuadros pintados a mano",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Art Design MAKR",

    description:
      "Cuadros 100% pintados a mano, personalizados en medida y diseño. Envíos a todo el Ecuador desde Quito.",

    images: [`${SITE_URL}/twitter-image.jpg`],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  verification: {
    google: "", // colocar Search Console cuando el dominio esté activo
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: SITE_NAME,
  },

  category: "Arte y Decoración",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={sourceSerif4.variable}>
      <head>
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-K1Q0MYDSKF"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-K1Q0MYDSKF');
            `,
          }}
        />

        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Round"
          rel="stylesheet"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />

        <StructuredData />
      </head>

      <body className="relative">
          <ToastProvider>
            <OnboardingProvider>
              <LayoutContentClient>
                {children}
              </LayoutContentClient>
            </OnboardingProvider>
          </ToastProvider>

      </body>
    </html>
  );
}