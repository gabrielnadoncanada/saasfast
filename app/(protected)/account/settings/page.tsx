import { requireAuthOrRedirect } from "@/shared/db/drizzle/auth";
import { AccountSettingsForm } from "@/features/account/settings/ui/AccountSettingsForm";

export default async function AccountSettingsPage() {
  const currentUser = await requireAuthOrRedirect();

  return (
    <div className="container mx-auto py-8">
      <AccountSettingsForm initialData={currentUser.profile} />
    </div>
  );
}
