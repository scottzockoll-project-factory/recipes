import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipePage() {
  async function createRecipe(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;

    const [inserted] = await db
      .insert(recipes)
      .values({ title, source })
      .returning({ id: recipes.id });

    redirect(`/recipes/${inserted.id}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">New Recipe</h1>
      <RecipeForm action={createRecipe} />
    </div>
  );
}
