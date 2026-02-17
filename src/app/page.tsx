import Link from "next/link";
import { getAllRecipes } from "@/data/recipes";
import SearchSection from "./search-section";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = await getAllRecipes();

  return (
    <div className="flex flex-col lg:flex-row lg:gap-8">
      {/* Left column: recipe list */}
      <div className="lg:w-1/2">
        <h2 className="text-xl font-semibold mb-6">All Recipes</h2>

        {allRecipes.length === 0 ? (
          <p className="text-stone-500">No recipes yet. Create your first one!</p>
        ) : (
          <ul className="space-y-2">
            {allRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="block border border-stone-200 rounded px-4 py-3 hover:bg-stone-100"
                >
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right column: search */}
      <div className="mt-8 lg:mt-0 lg:w-1/2">
        <SearchSection recipes={allRecipes} />
      </div>
    </div>
  );
}
