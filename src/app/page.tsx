import Link from "next/link";
import { getAllRecipes } from "@/data/recipes";
import SearchSection from "./search-section";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = await getAllRecipes();

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Search: top on mobile, right column on desktop */}
      <div className="order-first lg:order-last lg:w-1/2">
        <SearchSection recipes={allRecipes} />
      </div>

      {/* Recipe list: below search on mobile, left column on desktop */}
      <div className="mt-8 lg:mt-0 lg:w-1/2">
        <h2 className="text-xl font-semibold mb-6">All Recipes</h2>

        {allRecipes.length === 0 ? (
          <p className="text-stone-500 dark:text-stone-400">No recipes yet. Create your first one!</p>
        ) : (
          <ul className="space-y-2">
            {allRecipes.map((recipe) => (
              <li key={recipe.slug}>
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="block border border-stone-200 dark:border-stone-700 rounded px-4 py-3 hover:bg-stone-100 dark:hover:bg-stone-700"
                >
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
