"use client";

import { useInviteForm } from "@/features/tenant/invite/hooks/useInviteForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteForm() {
  const { form, onSubmit, isLoading, isSuccess } = useInviteForm();

  if (isSuccess) {
    return (
      <div className="p-4 border border-green-200 bg-green-50 rounded-md">
        <p className="text-green-800">
          L'invitation a été envoyée avec succès !
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="membre@exemple.com"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="role">Rôle</Label>
        <select
          id="role"
          {...form.register("role")}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="MEMBER">Membre</option>
          <option value="ADMIN">Administrateur</option>
          <option value="BILLING_ADMIN">Admin Facturation</option>
        </select>
        {form.formState.errors.role && (
          <p className="text-sm text-red-600 mt-1">
            {form.formState.errors.role.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Envoi..." : "Envoyer l'invitation"}
      </Button>
    </form>
  );
}