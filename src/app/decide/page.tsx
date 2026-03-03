export const dynamic = "force-dynamic";

import { getAllRecipesWithSource } from "@/data/recipes";
import DecideClient from "@/components/DecideClient";

export default async function DecidePage() {
  const recipes = await getAllRecipesWithSource();
  return <DecideClient recipes={recipes} />;
}
