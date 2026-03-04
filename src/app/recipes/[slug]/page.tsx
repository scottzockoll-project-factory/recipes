import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRecipe, archiveRecipe, unarchiveRecipe } from "@/data/recipes";
import RecipeView from "@/components/RecipeView";
import ArchiveButton from "@/components/ArchiveButton";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  if (!recipe) notFound();

  async function handleArchive() {
    "use server";
    await archiveRecipe(slug);
    redirect(`/recipes/${slug}`);
  }

  async function handleUnarchive() {
    "use server";
    await unarchiveRecipe(slug);
    redirect(`/recipes/${slug}`);
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold truncate">{recipe.title}</h1>
            {recipe.archivedAt && (
              <span className="shrink-0 text-xs bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 px-2 py-0.5 rounded">
                Archived
              </span>
            )}
          </div>
          {recipe.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {recipe.labels.map((label) => (
                <span
                  key={label}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          <Link
            href={`/recipes/${recipe.slug}/edit`}
            className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-600 rounded px-3 py-1"
          >
            Edit
          </Link>
          <ArchiveButton
            action={recipe.archivedAt ? handleUnarchive : handleArchive}
            isArchived={!!recipe.archivedAt}
          />
        </div>
      </div>
      <RecipeView source={recipe.source} />
    </div>
  );
}
