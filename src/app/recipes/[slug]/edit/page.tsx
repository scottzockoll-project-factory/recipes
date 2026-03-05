import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getRecipe, updateRecipe, getAllKnownNames, getAllKnownLabels } from "@/data/recipes";
import RecipeForm from "@/components/RecipeForm";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [recipe, { ingredients, cookware }, knownLabels] = await Promise.all([
    getRecipe(slug),
    getAllKnownNames(),
    getAllKnownLabels(),
  ]);

  if (!recipe) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;
    const labels = formData.getAll("labels") as string[];

    await updateRecipe(slug, title, source, labels);
    redirect(`/recipes/${slug}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Edit Recipe</h1>
      <RecipeForm
        action={handleUpdate}
        defaultValues={{ slug: recipe.slug, title: recipe.title, source: recipe.source, labels: recipe.labels }}
        knownIngredients={ingredients}
        knownCookware={cookware}
        knownLabels={knownLabels}
      />
    </div>
  );
}
