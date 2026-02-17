import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scott's Recipes",
  description: "A Cooklang recipe manager",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-stone-800 hover:text-stone-600">
              Scott&apos;s Recipes
            </a>
            <nav className="flex items-center gap-4">
              <a
                href="/suggestions"
                className="text-stone-600 hover:text-stone-800 text-sm"
              >
                Suggestions
              </a>
              <a
                href="/recipes/new"
                className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700 text-sm"
              >
                New Recipe
              </a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
