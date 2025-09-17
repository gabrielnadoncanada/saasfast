"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/features/auth/shared/ui/UserTenantProvider";
// Helper function to format date
const formatJoinedDate = (date: Date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "OWNER":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "ADMIN":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "BILLING_ADMIN":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case "OWNER":
      return "Propriétaire";
    case "ADMIN":
      return "Administrateur";
    case "BILLING_ADMIN":
      return "Admin Facturation";
    case "MEMBER":
      return "Membre";
    default:
      return role;
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const TeamsSection = memo(function TeamsSection() {
  const { tenants, currentTenant, switchTenant, isLoadingTenants } = useUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Équipes</CardTitle>
        <CardDescription>
          Les équipes qui sont associées à votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tenants.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucune équipe trouvée.
          </div>
        ) : (
          <div className="space-y-4">
            {tenants.map((tenantData) => (
              <div
                key={tenantData.tenant.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={tenantData.tenant.logoUrl || ""}
                      alt={tenantData.tenant.businessName}
                    />
                    <AvatarFallback>
                      {getInitials(tenantData.tenant.businessName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {tenantData.tenant.businessName}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                          tenantData.membership.role
                        )}`}
                      >
                        {getRoleLabel(tenantData.membership.role)}
                      </span>
                      {currentTenant?.tenant.id === tenantData.tenant.id && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Actuel
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Rejoint le{" "}
                      {formatJoinedDate(tenantData.membership.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {currentTenant?.tenant.id !== tenantData.tenant.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchTenant(tenantData.tenant.id)}
                      disabled={isLoadingTenants}
                    >
                      {isLoadingTenants ? "Changement..." : "Activer"}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                      {tenantData.canManageSettings && (
                        <DropdownMenuItem>
                          Paramètres de l'équipe
                        </DropdownMenuItem>
                      )}
                      {tenantData.canManageMembers && (
                        <DropdownMenuItem>Gérer les membres</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
