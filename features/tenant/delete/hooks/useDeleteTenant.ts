"use client";

import { useState } from "react";
import { deleteTenantAction } from "../actions/deleteTenant.action";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";
import { useToastError } from "@/shared/hooks/useToastError";

export function useDeleteTenant() {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);
  const { refreshTenants } = useUser();

  const deleteTenant = async (tenantId: string) => {
    clearServerError();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("tenantId", tenantId);

    try {
      const res = await deleteTenantAction(formData);

      if (!res.success) {
        setServerError(res.error || "Erreur inconnue");
        return false;
      }

      // Refresh the tenants data to update the UI
      await refreshTenants();

      return true;
    } catch (error) {
      console.error("Error in deleteTenant:", error);
      setServerError("Erreur lors de la suppression du workspace.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteTenant,
    isLoading,
    serverError,
  };
}
