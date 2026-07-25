import Link from "next/link";
import { SidebarNav } from "@/components/shared/SidebarNav";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">ICF AI Copilot</Link>
        </div>
        <div className="flex-1 py-4"><SidebarNav /></div>
        <div className="border-t border-border p-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prototype</p>
            <p className="mt-1 text-sm">Public demo mode</p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <div className="flex h-16 items-center justify-between border-b border-border px-4 md:hidden">
          <Link href="/" className="font-bold">ICF AI Copilot</Link>
          <span className="rounded-full bg-muted px-3 py-1 text-xs">Demo</span>
        </div>
        {children}
      </main>
    </div>
  );
}
