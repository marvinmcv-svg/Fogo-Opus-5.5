import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/300-italic.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource-variable/inter-tight";
import "./globals.css";
import { RESTAURANT } from "@/content/restaurant";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Fogo de Chão · Ventura Mall — Churrasquería brasileña en Santa Cruz",
  description:
    "Fogo de Chão abre su segunda casa en Santa Cruz de la Sierra, en el Boulevard de Ventura Mall. Churrasco a fuego vivo, Mesa del Mercado y reservas con Sofía, nuestra recepcionista.",
  openGraph: {
    title: "Fogo de Chão · Ventura Mall",
    description: "Donde el fuego se vuelve ritual. Churrasquería brasileña en Santa Cruz de la Sierra.",
    images: ["/media/stills/picanha.webp"],
    locale: "es_BO",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#0b0806", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: `${RESTAURANT.name} ${RESTAURANT.branch}`,
  servesCuisine: ["Brazilian", "Steakhouse", "Churrasco"],
  address: {
    "@type": "PostalAddress",
    streetAddress: RESTAURANT.address.es,
    addressLocality: RESTAURANT.city,
    addressCountry: "BO",
  },
  acceptsReservations: true,
  sameAs: [RESTAURANT.instagram],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
