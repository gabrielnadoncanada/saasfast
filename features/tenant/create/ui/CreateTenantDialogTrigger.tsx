"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTenantForm } from "../hooks/useCreateTenantForm";

interface CreateTenantDialogTriggerProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateTenantDialogTrigger({
  children,
  onSuccess,
}: CreateTenantDialogTriggerProps) {
  const [open, setOpen] = useState(false);
  const { form, onSubmit, isLoading, isSuccess } = useCreateTenantForm();

  // Close dialog on success and call onSuccess callback
  React.useEffect(() => {
    if (isSuccess) {
      setOpen(false);
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await form.handleSubmit(onSubmit)();
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau workspace</DialogTitle>
            <DialogDescription>
              Donnez un nom à votre nouveau workspace. Vous pourrez l'utiliser
              pour organiser vos projets.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nom
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Mon workspace"
                    className="w-full"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
