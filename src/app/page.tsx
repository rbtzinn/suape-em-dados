import { CompliancePreview } from "@/modules/landing/components/CompliancePreview";
import { DataFlow } from "@/modules/landing/components/DataFlow";
import { Hero } from "@/modules/landing/components/Hero";
import { LandingFooter } from "@/modules/landing/components/LandingFooter";
import { LandingHeader } from "@/modules/landing/components/LandingHeader";
import { ModulesOverview } from "@/modules/landing/components/ModulesOverview";
import { SecurityStrip } from "@/modules/landing/components/SecurityStrip";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <LandingHeader />
      <Hero />
      <ModulesOverview />
      <DataFlow />
      <CompliancePreview />
      <SecurityStrip />
      <LandingFooter />
    </main>
  );
}
