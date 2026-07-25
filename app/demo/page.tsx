import { DemoExperience } from "@/components/demo/DemoExperience";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "ICF AI Copilot — Decision Intelligence Assessment",
  description:
    "ICF (Integrative Cognitive Framework) Decision Intelligence Assessment — Mind, Goal and Body / Capacity domains. Transparent, explainable recommendations.",
};

interface DemoPageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const demoMode = params.mode === "demo";

  return (
    <div className="min-h-screen text-slate-100" style={{ background: "#0b1324" }}>
      {/* Skip link */}
      <a
        href="#assessment-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to assessment
      </a>

      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 border-b border-slate-700/50"
        style={{ background: "rgba(11,19,36,0.95)", backdropFilter: "blur(16px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
            aria-label="Return to ICF AI Copilot home"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">ICF AI Copilot</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <div className="flex items-center gap-2">
            {demoMode ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 px-3 py-1 text-xs text-amber-300"
                style={{ background: "rgba(245,158,11,0.08)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Demo Mode — Sample Data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 px-3 py-1 text-xs text-indigo-300"
                style={{ background: "rgba(99,102,241,0.08)" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Decision Intelligence Assessment
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <main id="assessment-content">
        <DemoExperience autoDemo={demoMode} />
      </main>
    </div>
  );
}
