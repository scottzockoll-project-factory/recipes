import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq } from "drizzle-orm";
import RecipeForm from "@/components/RecipeForm";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, parseInt(id)));

  if (!recipe) notFound();

  async function updateRecipe(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const source = formData.get("source") as string;

    await db
      .update(recipes)
      .set({ title, source, updatedAt: new Date() })
      .where(eq(recipes.id, parseInt(id)));

    redirect(`/recipes/${parseInt(id)}`);
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Edit Recipe</h1>
      <RecipeForm
        action={updateRecipe}
        defaultValues={{ title: recipe.title, source: recipe.source }}
      />
    </div>
  );
}
