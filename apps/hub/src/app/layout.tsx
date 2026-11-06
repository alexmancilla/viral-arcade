import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Viral Hub", description: "Trends in, briefs out, Devin builds." };

const nav = [
  ["/", "Overview"],
  ["/sources", "Sources"],
  ["/trends", "Trends"],
  ["/briefs", "Briefs"],
  ["/builds", "Builds"],
  ["/games", "Games"],
] as const;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-52 shrink-0 border-r border-zinc-800 p-4">
            <div className="text-lg font-bold mb-6">Viral Hub</div>
            <nav className="flex flex-col gap-1">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white">
                  {label}
                </Link>
              ))}
            </nav>
            <p className="mt-8 text-xs text-zinc-500">Trends in, briefs out, Devin builds.</p>
          </aside>
          <main className="flex-1 p-8 max-w-6xl">{children}</main>
        </div>
      </body>
    </html>
  );
}
