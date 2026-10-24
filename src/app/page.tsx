import { Providers } from "@/components/providers";
import { Preloader } from "@/components/preloader";
import { Cursor } from "@/components/cursor";
import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { FilmSequence } from "@/components/film-sequence";
import { Ritual } from "@/components/ritual";
import { Cuts } from "@/components/cuts";
import { MarketTable } from "@/components/market-table";
import { Bar } from "@/components/bar";
import { Gallery } from "@/components/gallery";
import { Visit } from "@/components/visit";
import { Reserve } from "@/components/reserve";
import { Footer } from "@/components/footer";
import { Sofia } from "@/components/sofia";

export default function Home() {
  return (
    <Providers>
      <Preloader />
      <Cursor />
      <div className="grain" aria-hidden />
      <Nav />
      <main>
        <Hero />
        <FilmSequence />
        <Ritual />
        <Cuts />
        <MarketTable />
        <Bar />
        <Gallery />
        <Visit />
        <Reserve />
      </main>
      <Footer />
      <Sofia />
    </Providers>
  );
}
