"use server";

import { revalidatePath } from "next/cache";
import {
  createMealPrep,
  updateMealPrep,
  deleteMealPrep,
} from "@/data/meal-preps";
import type { MealPrep } from "@/data/meal-preps";

export async function createPrepAction(
  name: string,
  recipeSlugs: string[],
): Promise<MealPrep> {
  const prep = await createMealPrep(name, recipeSlugs);
  revalidatePath("/prep");
  return prep;
}

export async function updatePrepAction(
  id: number,
  name: string,
  recipeSlugs: string[],
): Promise<void> {
  await updateMealPrep(id, name, recipeSlugs);
  revalidatePath("/prep");
}

export async function deletePrepAction(id: number): Promise<void> {
  await deleteMealPrep(id);
  revalidatePath("/prep");
}
