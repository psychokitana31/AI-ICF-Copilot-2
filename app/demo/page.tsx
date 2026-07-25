import { DemoExperience } from "@/components/demo/DemoExperience";

export const metadata = {
  title: "ICF AI Copilot — Demo Assessment",
  description: "Decision Intelligence Assessment — Mind, Goal and Capacity domains.",
};

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Slim nav */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <a href="/" className="text-sm font-semibold text-white hover:text-slate-300">
            ← ICF AI Copilot
          </a>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
            Demo prototype
          </span>
        </div>
        <DemoExperience />
      </div>
    </main>
  );
}
