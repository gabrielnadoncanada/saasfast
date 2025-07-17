import { UseFormReturn, FieldValues } from "react-hook-form";

export function injectFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: Partial<Record<keyof T, string[] | string>> | undefined
) {
  if (!fieldErrors) return;

  Object.entries(fieldErrors).forEach(([field, messages]) => {
    if (!messages) return;
    const arr = Array.isArray(messages) ? messages : [messages];
    arr.forEach((message) => {
      form.setError(field as any, { type: "server", message });
    });
  });
}
