"use client";

import { useEffect } from "react";
import { deleteTenantAction } from "../actions/deleteTenant.action";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";
import { useAction } from "@/shared/hooks/useAction";

export function useDeleteTenant() {
  const { refreshTenants } = useUser();
  const { executeAction, isLoading, actionState } =
    useAction(deleteTenantAction);

  useEffect(() => {
    if (actionState?.success) {
      refreshTenants();
    }
  }, [actionState, refreshTenants]);

  const deleteTenant = (tenantId: string) => {
    executeAction({ tenantId });
  };

  return {
    deleteTenant,
    isLoading,
    actionState,
  };
}
