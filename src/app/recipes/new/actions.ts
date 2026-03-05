"use server";

import { redirect } from "next/navigation";
import { createRecipe, isSlugAvailable, isTitleAvailable } from "@/data/recipes";

export async function createRecipeAction(
  _prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  const slug = formData.get("slug") as string;
  const title = formData.get("title") as string;
  const source = formData.get("source") as string;
  const labels = formData.getAll("labels") as string[];

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return "Slug must contain only lowercase letters, numbers, and hyphens.";
  }

  const [slugOk, titleOk] = await Promise.all([
    isSlugAvailable(slug),
    isTitleAvailable(title),
  ]);

  if (!slugOk) return `A recipe with the slug "${slug}" already exists.`;
  if (!titleOk) return `A recipe titled "${title}" already exists.`;

  await createRecipe(slug, title, source, labels);
  redirect(`/recipes/${slug}`);
}
