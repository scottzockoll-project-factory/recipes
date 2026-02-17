import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipes",
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
        <div className="max-w-2xl mx-auto px-4 py-8">
          <header className="mb-8">
            <a href="/" className="text-2xl font-bold text-stone-800 hover:text-stone-600">
              Recipes
            </a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
