import { getAllKnownNames, getAllKnownLabels } from "@/data/recipes";
import NewRecipeClient from "./NewRecipeClient";

export default async function NewRecipePage() {
  const [{ ingredients, cookware }, knownLabels] = await Promise.all([
    getAllKnownNames(),
    getAllKnownLabels(),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">New Recipe</h1>
      <NewRecipeClient
        knownIngredients={ingredients}
        knownCookware={cookware}
        knownLabels={knownLabels}
      />
    </div>
  );
}
