"use client";

import React, { memo, useState, useEffect, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { linkOAuthProvider } from "@/features/account/settings/actions/linkOAuthProvider.action";
import { unlinkOAuthProvider } from "@/features/account/settings/actions/unlinkOAuthProvider.action";
import {
  getLinkedProviders,
  type LinkedProvidersResult,
} from "@/features/account/settings/actions/getLinkedProviders.action";
import {
  OAUTH_PROVIDERS,
  type OAuthProviderConfig,
} from "@/features/account/settings/config/oauth-providers.config";
import { useToast } from "@/components/ui/Toasts/use-toast";
import type { Provider } from "@supabase/supabase-js";

interface UnlinkDialogState {
  isOpen: boolean;
  provider: OAuthProviderConfig | null;
}

export const SignInSection = memo(function SignInSection() {
  const [linkedData, setLinkedData] = useState<LinkedProvidersResult>({
    providers: [],
    hasPassword: false,
  });
  const [unlinkDialog, setUnlinkDialog] = useState<UnlinkDialogState>({
    isOpen: false,
    provider: null,
  });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Charger les providers liés au montage du composant
  useEffect(() => {
    startTransition(async () => {
      const data = await getLinkedProviders();
      setLinkedData(data);
    });
  }, []);

  const isProviderLinked = (providerId: Provider) => {
    return linkedData.providers.some((p) => p.provider === providerId);
  };

  const handleLinkProvider = async (providerId: Provider) => {
    startTransition(async () => {
      try {
        await linkOAuthProvider(providerId);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur s'est produite lors de la liaison du compte",
        });
      }
    });
  };

  const handleUnlinkProvider = (providerConfig: OAuthProviderConfig) => {
    setUnlinkDialog({
      isOpen: true,
      provider: providerConfig,
    });
  };

  const confirmUnlink = async () => {
    if (!unlinkDialog.provider) return;

    const providerId = unlinkDialog.provider.id;

    startTransition(async () => {
      try {
        const result = await unlinkOAuthProvider(providerId);

        if (result.success) {
          toast({
            title: "Succès",
            description: result.message,
          });
          // Rafraîchir la liste des providers
          const data = await getLinkedProviders();
          setLinkedData(data);
        } else {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: result.message || "Une erreur s'est produite",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur inattendue s'est produite",
        });
      } finally {
        setUnlinkDialog({ isOpen: false, provider: null });
      }
    });
  };

  const closeUnlinkDialog = () => {
    setUnlinkDialog({ isOpen: false, provider: null });
  };

  const totalAuthMethods =
    linkedData.providers.length + (linkedData.hasPassword ? 1 : 0);
  const canUnlink = totalAuthMethods > 1;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Méthodes de connexion</CardTitle>
          <CardDescription>
            Gérez les services connectés à votre compte. Vous devez garder au
            moins une méthode de connexion active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OAUTH_PROVIDERS.map((providerConfig) => {
              const Icon = providerConfig.icon;
              const isLinked = isProviderLinked(providerConfig.id);

              return (
                <div
                  key={providerConfig.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full bg-muted`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{providerConfig.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isLinked
                          ? `Compte ${providerConfig.name} connecté`
                          : `Connecter votre compte ${providerConfig.name}`}
                      </p>
                    </div>
                  </div>

                  {isLinked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnlinkProvider(providerConfig)}
                      disabled={isPending || !canUnlink}
                    >
                      {isPending ? "Chargement..." : "Délier"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkProvider(providerConfig.id)}
                      disabled={isPending}
                    >
                      {isPending ? "Chargement..." : "Lier"}
                    </Button>
                  )}
                </div>
              );
            })}

            {linkedData.hasPassword && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-emerald-500 text-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email & Mot de passe</h3>
                    <p className="text-sm text-muted-foreground">
                      Authentification par email
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground px-3 py-1 bg-background border rounded-md">
                  Actif
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={unlinkDialog.isOpen} onOpenChange={closeUnlinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Délier le compte</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir délier votre compte{" "}
              {unlinkDialog.provider?.name} ? Vous pourrez toujours le
              reconnecter plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnlink}
              className="bg-red-600 hover:bg-red-700"
            >
              Délier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
});
