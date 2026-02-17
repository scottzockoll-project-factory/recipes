import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getRecipe, updateRecipe } from "@/data/recipes";
import RecipeForm from "@/components/RecipeForm";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipeId = parseInt(id);
  const recipe = await getRecipe(recipeId);

  if (!recipe) notFound();

  async function handleUpdate(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;

    await updateRecipe(recipeId, title, source);
    redirect(`/recipes/${recipeId}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Edit Recipe</h1>
      <RecipeForm
        action={handleUpdate}
        defaultValues={{ title: recipe.title, source: recipe.source }}
      />
    </div>
  );
}
