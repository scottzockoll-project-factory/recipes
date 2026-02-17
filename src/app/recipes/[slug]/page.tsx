import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipe } from "@/data/recipes";
import RecipeView from "@/components/RecipeView";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">{recipe.title}</h1>
        <Link
          href={`/recipes/${recipe.slug}/edit`}
          className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-600 rounded px-3 py-1"
        >
          Edit
        </Link>
      </div>
      <RecipeView source={recipe.source} />
    </div>
  );
}
