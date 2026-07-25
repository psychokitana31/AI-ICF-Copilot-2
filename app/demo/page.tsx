import { DemoExperience } from "@/components/demo/DemoExperience";

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
    <main
      id="main-content"
      className="min-h-screen bg-slate-950 text-white"
    >
      {/* Skip to main content — keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-7xl">
        {/* Navigation bar */}
        <nav
          className="flex items-center justify-between border-b border-white/10 px-6 py-4"
          aria-label="Assessment navigation"
        >
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-white hover:text-slate-300"
            aria-label="Return to ICF AI Copilot home"
          >
            <span aria-hidden="true">←</span> ICF AI Copilot
          </a>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
              {demoMode ? "Demo Mode — Sample Data" : "Decision Intelligence"}
            </span>
          </div>
        </nav>

        {/* Assessment experience — autoDemo triggers sample load */}
        <DemoExperience autoDemo={demoMode} />
      </div>
    </main>
  );
}
