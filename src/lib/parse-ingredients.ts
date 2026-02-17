export function parseIngredients(input: string): string[] {
  const ingredients: string[] = [];
  const trimmed = input.trim();
  if (!trimmed) return ingredients;

  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if (inQuote) {
      if (char === inQuote) {
        const token = current.trim().toLowerCase();
        if (token) ingredients.push(token);
        current = "";
        inQuote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      const token = current.trim().toLowerCase();
      if (token) ingredients.push(token);
      current = "";
      inQuote = char;
    } else if (char === " ") {
      const token = current.trim().toLowerCase();
      if (token) ingredients.push(token);
      current = "";
    } else {
      current += char;
    }
  }

  const remaining = current.trim().toLowerCase();
  if (remaining) ingredients.push(remaining);

  return ingredients;
}
