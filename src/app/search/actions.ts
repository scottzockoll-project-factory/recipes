"use server";

import { searchRecipesByIngredients } from "@/data/recipes";

export async function searchByIngredients(ingredients: string[]) {
  return searchRecipesByIngredients(ingredients);
}
