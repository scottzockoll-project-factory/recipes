"use server";

import { createProfile, updateProfile, deleteProfile, setDefaultProfile } from "@/data/profiles";
import type { Profile } from "@/data/profiles";
import { revalidatePath } from "next/cache";

export async function createProfileAction(
  name: string,
  ingredients: string[],
  isDefault: boolean,
): Promise<Profile> {
  const profile = await createProfile(name, ingredients, isDefault);
  revalidatePath("/decide");
  return profile;
}

export async function updateProfileAction(
  id: number,
  name: string,
  ingredients: string[],
): Promise<void> {
  await updateProfile(id, name, ingredients);
  revalidatePath("/decide");
}

export async function deleteProfileAction(id: number): Promise<void> {
  await deleteProfile(id);
  revalidatePath("/decide");
}

export async function setDefaultProfileAction(id: number): Promise<void> {
  await setDefaultProfile(id);
  revalidatePath("/decide");
}
