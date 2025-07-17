import { ZodType } from "zod";
import type { FormResult } from "@/shared/types/api.types";
import { extractFieldErrors } from "./extractFieldErrors";

export async function safeParseForm<T>(
  formData: FormData,
  schema: ZodType<T, any, any>
): Promise<FormResult<T>> {
  const raw = Object.fromEntries(formData);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors = extractFieldErrors<T>(parsed.error);
    return {
      success: false,
      error: "Validation échouée",
      fieldErrors,
    };
  }

  return {
    success: true,
    data: parsed.data,
  };
}
