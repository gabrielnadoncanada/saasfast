import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { UserTenantProvider } from "@/features/auth/shared/ui/UserTenantProvider";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialData = await requireTenantContext();

  return (
    <UserTenantProvider initialData={initialData}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </UserTenantProvider>
  );
}
