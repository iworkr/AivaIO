"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { LogoCloud } from "@/components/landing/logo-cloud";
import { BentoGrid } from "@/components/landing/bento-grid";
import { GenerativeUI } from "@/components/landing/generative-ui";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background-main)]">
      <Navbar />
      <Hero />
      <LogoCloud />
      <BentoGrid />
      <GenerativeUI />
      <Testimonials />
      <Pricing />
      <Footer />
    </main>
  );
}
