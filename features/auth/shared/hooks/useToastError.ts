import { useState } from "react";
import { useToast } from "@/components/ui/Toasts/use-toast";

export function useToastError() {
  const [serverError, setServerErrorState] = useState<string | null>(null);
  const { toast } = useToast();

  const setServerError = (error: string | null) => {
    setServerErrorState(error);

    if (error) {
      toast({
        title: "Erreur",
        description: error,
        variant: "destructive",
      });
    }
  };

  const clearServerError = () => {
    setServerErrorState(null);
  };

  return {
    serverError,
    setServerError,
    clearServerError,
  };
}
