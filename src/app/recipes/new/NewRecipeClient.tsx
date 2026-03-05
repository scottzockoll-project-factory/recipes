"use client";

import { useActionState } from "react";
import { createRecipeAction } from "./actions";
import RecipeForm from "@/components/RecipeForm";

export default function NewRecipeClient({
  knownIngredients,
  knownCookware,
  knownLabels,
}: {
  knownIngredients: string[];
  knownCookware: string[];
  knownLabels: string[];
}) {
  const [error, formAction] = useActionState(createRecipeAction, null);

  return (
    <RecipeForm
      action={formAction}
      knownIngredients={knownIngredients}
      knownCookware={knownCookware}
      knownLabels={knownLabels}
      error={error ?? undefined}
    />
  );
}
