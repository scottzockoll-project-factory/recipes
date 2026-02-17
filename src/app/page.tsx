import Link from "next/link";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allRecipes = await db
    .select({ id: recipes.id, title: recipes.title })
    .from(recipes)
    .orderBy(desc(recipes.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">All Recipes</h1>
        <Link
          href="/recipes/new"
          className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700 text-sm"
        >
          New Recipe
        </Link>
      </div>

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
  );
}
