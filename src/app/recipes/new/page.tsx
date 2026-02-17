import { redirect } from "next/navigation";
import { createRecipe, isSlugAvailable, getAllKnownNames } from "@/data/recipes";
import RecipeForm from "@/components/RecipeForm";

export default async function NewRecipePage() {
  const { ingredients, cookware } = await getAllKnownNames();

  async function handleCreate(formData: FormData) {
    "use server";
    const slug = formData.get("slug") as string;
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;

    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
    }

    const available = await isSlugAvailable(slug);
    if (!available) {
      throw new Error(`A recipe with slug "${slug}" already exists`);
    }

    await createRecipe(slug, title, source);
    redirect(`/recipes/${slug}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">New Recipe</h1>
      <RecipeForm
        action={handleCreate}
        knownIngredients={ingredients}
        knownCookware={cookware}
      />
    </div>
  );
}
