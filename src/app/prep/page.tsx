export const dynamic = "force-dynamic";

import { getAllRecipesWithSource } from "@/data/recipes";
import PrepClient from "@/components/PrepClient";

export default async function PrepPage() {
  const recipes = await getAllRecipesWithSource();
  return <PrepClient recipes={recipes} />;
}
