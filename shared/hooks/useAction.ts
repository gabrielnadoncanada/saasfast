import { useActionState, useEffect } from "react";
import { useToastError } from "@/shared/hooks/useToastError";

type ActionResult = {
  success: boolean;
  error?: string;
};

type ServerAction = (formData: FormData) => Promise<ActionResult>;

export function useAction(action: ServerAction) {
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
      } else {
        clearServerError();
      }
    }
  }, [actionState, setServerError, clearServerError]);

  const executeAction = (data: Record<string, string>) => {
    clearServerError();
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formAction(formData);
  };

  return {
    executeAction,
    isLoading: isPending,
    actionState,
  };
}
