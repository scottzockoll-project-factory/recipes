import { redirect } from "next/navigation";
import { createRecipe } from "@/data/recipes";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  async function handleCreate(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;

    const { id } = await createRecipe(title, source);
    redirect(`/recipes/${id}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">New Recipe</h1>
      <RecipeForm action={handleCreate} />
    </div>
  );
}
