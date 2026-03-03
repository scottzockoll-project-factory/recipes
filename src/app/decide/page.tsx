export const dynamic = "force-dynamic";

import { getAllRecipesWithSource } from "@/data/recipes";
import { getAllProfiles } from "@/data/profiles";
import DecideClient from "@/components/DecideClient";

export default async function DecidePage() {
  const [recipes, profiles] = await Promise.all([getAllRecipesWithSource(), getAllProfiles()]);
  return <DecideClient recipes={recipes} initialProfiles={profiles} />;
}
