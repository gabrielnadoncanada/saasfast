import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UserProvider } from "@/features/auth/shared/ui/UserProvider";
import {
  getCurrentUser,
  requireAuthOrRedirect,
} from "@/shared/db/drizzle/auth";
import { Header } from "@/components/layout/header";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await requireAuthOrRedirect();

  return (
    <UserProvider initial={current}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
