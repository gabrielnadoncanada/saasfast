import { useActionState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

type ServerAction = (formData: FormData) => Promise<ActionResult>;

export function useFormAction<T extends Record<string, any>>(
  action: ServerAction,
  form: UseFormReturn<T>
) {
  const { setServerError, clearServerError } = useToastError();

  // Wrapper pour adapter l'action à useActionState
  const actionWrapper = async (
    prevState: ActionResult | null,
    formData: FormData
  ) => {
    return await action(formData);
  };

  const [actionState, formAction, isPending] = useActionState(
    actionWrapper,
    null
  );

  useEffect(() => {
    if (actionState) {
      if (!actionState.success) {
        setServerError(actionState.error || "Erreur inconnue");
        injectFieldErrors(form, actionState.fieldErrors as any);
      } else {
        clearServerError();
      }
    }
  }, [actionState, form, setServerError, clearServerError]);

  const submitForm = (data: T) => {
    clearServerError();
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    formAction(formData);
  };

  return {
    submitForm,
    isLoading: isPending,
    actionState,
  };
}
