"use client";

import * as React from "react";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";
import type { TenantWithProfile } from "@/features/auth/shared/ui/UserTenantProvider";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function TenantSwitcher({ tenants }: { tenants: TenantWithProfile[] }) {
  const { isMobile } = useSidebar();
  const { currentTenant, switchTenant, isLoadingTenants } = useUser();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitchTenant = async (tenantId: string) => {
    if (tenantId === currentTenant?.tenant.id || isSwitching) return;

    setIsSwitching(true);
    try {
      await switchTenant(tenantId);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!currentTenant) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isLoadingTenants || isSwitching}
            >
              <Avatar className="size-8">
                <AvatarImage
                  src={currentTenant.tenant.logoUrl || undefined}
                  alt={currentTenant.tenant.name}
                />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                  {currentTenant.tenant.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {currentTenant.tenant.businessName ||
                    currentTenant.tenant.name}
                </span>
                <span className="truncate text-xs capitalize">
                  {currentTenant.tenant.plan.toLowerCase()}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Workspaces
            </DropdownMenuLabel>
            {tenants.map((tenant) => (
              <DropdownMenuItem
                key={tenant.tenant.id}
                onClick={() => handleSwitchTenant(tenant.tenant.id)}
                className="gap-2 p-2"
              >
                <Avatar className="size-6">
                  <AvatarImage
                    src={tenant.tenant.logoUrl || undefined}
                    alt={tenant.tenant.name}
                  />
                  <AvatarFallback className="text-xs">
                    {tenant.tenant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {tenant.tenant.businessName || tenant.tenant.name}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {tenant.membership.role.toLowerCase()}
                  </div>
                </div>
                {currentTenant.tenant.id === tenant.tenant.id && (
                  <Check className="size-4" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                Créer un workspace
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
