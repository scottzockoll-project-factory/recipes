import { Recipe } from "@cooklang/cooklang-ts";

export default function RecipeView({ source }: { source: string }) {
  const recipe = new Recipe(source);

  return (
    <div className="space-y-6">
      {Object.keys(recipe.metadata).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Info</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(recipe.metadata).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="font-medium text-stone-600 dark:text-stone-400">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Ingredients</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.quantity && ing.quantity !== "some"
                  ? `${ing.quantity} `
                  : ""}
                {ing.units ? `${ing.units} ` : ""}
                {ing.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.steps.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Steps</h2>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            {recipe.steps.map((step, i) => (
              <li key={i}>
                {step.map((token, j) => {
                  switch (token.type) {
                    case "ingredient":
                      return (
                        <span key={j} className="font-medium text-amber-700 dark:text-amber-400">
                          {token.name}
                        </span>
                      );
                    case "cookware":
                      return (
                        <span key={j} className="font-medium text-stone-600 dark:text-stone-400">
                          {token.name}
                        </span>
                      );
                    case "timer":
                      return (
                        <span key={j} className="font-medium text-blue-600 dark:text-blue-400">
                          {token.quantity} {token.units}
                        </span>
                      );
                    case "text":
                      return <span key={j}>{token.value}</span>;
                    default:
                      return null;
                  }
                })}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
