import Link from "next/link";
import { Activity, ArrowUpRight, Brain, CircleAlert, Compass, Target } from "lucide-react";

const metrics = [
  { label: "Focus Index", value: "78", suffix: "/100", icon: Target },
  { label: "Decision Readiness", value: "High", suffix: "", icon: Compass },
  { label: "Cognitive Load", value: "64", suffix: "%", icon: Brain },
  { label: "Active Priorities", value: "3", suffix: "", icon: Activity },
];

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Decision Intelligence Dashboard</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Your development snapshot</h1>
          <p className="mt-2 text-muted-foreground">Demo data illustrating the ICF AI Copilot experience.</p>
        </div>
        <Link href="/assessment" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
          Start assessment <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, suffix, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-5 w-5 text-primary" /></div>
            <p className="mt-4 text-3xl font-bold">{value}<span className="text-base font-medium text-muted-foreground">{suffix}</span></p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">AI Decision Twin</p><h2 className="mt-1 text-xl font-semibold">Recommended focus</h2></div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Updated today</span>
          </div>
          <div className="mt-6 rounded-xl bg-muted p-5">
            <p className="font-medium">Complete one launch-critical milestone before adding new initiatives.</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your current pattern shows strong strategic ambition with elevated cognitive load. Consolidation is likely to improve execution quality and reduce decision fatigue.</p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[["1", "Select milestone"],["2", "Block focus time"],["3", "Review evidence"]].map(([n,t]) => <div key={n} className="rounded-lg border p-4"><span className="text-xs font-semibold text-primary">STEP {n}</span><p className="mt-2 text-sm font-medium">{t}</p></div>)}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-amber-500"/><h2 className="text-xl font-semibold">Risk radar</h2></div>
          <div className="mt-5 space-y-5">
            {[["Parallel workload",82],["Recovery deficit",61],["Goal ambiguity",34]].map(([label,value]) => (
              <div key={String(label)}>
                <div className="flex justify-between text-sm"><span>{label}</span><span className="text-muted-foreground">{value}%</span></div>
                <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width:`${value}%`}} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
