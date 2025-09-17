import { requireAuthOrRedirect } from "@/shared/db/drizzle/auth";
import { AccountSettingsForm } from "@/features/account/settings/ui/AccountSettingsForm";
import { PageHeader } from "@/components/layout/page-header";

export default async function AccountSettingsPage() {
  const currentUser = await requireAuthOrRedirect();

  return (
    <div className="container mx-auto py-8 px-6">
      <PageHeader title="Profile" />
      <AccountSettingsForm initialData={currentUser.profile} />
    </div>
  );
}
