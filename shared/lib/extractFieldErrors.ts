import { treeifyError } from "zod";

export function extractFieldErrors<T>(
  error: unknown
): Partial<Record<keyof T, string[]>> {
  if (!error) return {};
  // @ts-ignore
  const tree = treeifyError(error);
  const fieldErrors: Partial<Record<keyof T, string[]>> = {};

  if (
    tree &&
    typeof tree === "object" &&
    "items" in tree &&
    tree.items &&
    typeof tree.items === "object" &&
    !Array.isArray(tree.items)
  ) {
    Object.entries(tree.items).forEach(([key, value]) => {
      if (
        value &&
        typeof value === "object" &&
        "errors" in value &&
        Array.isArray((value as any).errors) &&
        (value as any).errors.length > 0
      ) {
        fieldErrors[key as keyof T] = (value as any).errors as string[];
      }
    });
  }

  return fieldErrors;
}
