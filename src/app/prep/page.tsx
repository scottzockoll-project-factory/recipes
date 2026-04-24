export const dynamic = "force-dynamic";

import { getAllRecipesWithSource } from "@/data/recipes";
import { getAllMealPreps } from "@/data/meal-preps";
import PrepClient from "@/components/PrepClient";

export default async function PrepPage() {
  const [recipes, savedPreps] = await Promise.all([
    getAllRecipesWithSource(),
    getAllMealPreps(),
  ]);
  return <PrepClient recipes={recipes} initialPreps={savedPreps} />;
}
