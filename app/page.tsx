import { listActiveServices } from "@/services/appointment.service";
import { SiteNavbar } from "@/components/layout/site-navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeroSection } from "@/features/marketing/hero-section";
import { AboutSection } from "@/features/marketing/about-section";
import { ServicesSection } from "@/features/marketing/services-section";
import { GallerySection } from "@/features/marketing/gallery-section";
import { FaqSection } from "@/features/marketing/faq-section";
import { LocationSection } from "@/features/marketing/location-section";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const services = await listActiveServices();

  return (
    <>
      <SiteNavbar />
      <main className="bg-luxury">
        <HeroSection />
        <AboutSection />
        <ServicesSection services={services} />
        <GallerySection />
        <FaqSection />
        <LocationSection />
      </main>
      <SiteFooter />
    </>
  );
}
