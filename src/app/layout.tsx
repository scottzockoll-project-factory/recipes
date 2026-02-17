import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import OverflowMenu from "@/components/OverflowMenu";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <header className="mb-8 flex items-center justify-between">
            <a href="/" className="text-2xl font-bold text-stone-800 dark:text-stone-200 hover:text-stone-600 dark:hover:text-stone-400">
              Scott&apos;s Recipes
            </a>
            <nav className="flex items-center gap-2">
              <a
                href="/recipes/new"
                className="bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-300 text-sm"
              >
                <span className="hidden sm:inline">New Recipe</span>
                <span className="sm:hidden text-lg leading-none">+</span>
              </a>
              <ThemeToggle />
              <OverflowMenu />
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
