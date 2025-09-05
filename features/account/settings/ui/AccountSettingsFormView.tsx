import { memo, RefObject } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AccountSettingsSchema } from "@/features/account/settings/schema/settings.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface AccountSettingsFormViewProps {
  form: UseFormReturn<AccountSettingsSchema>;
  onSubmit: (data: AccountSettingsSchema) => void;
  isLoading: boolean;
  serverError?: string | null;
  fileError?: string | null;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => void;
  handleAvatarClick: () => void;
}

export const AccountSettingsFormView = memo(function AccountSettingsFormView({
  form,
  onSubmit,
  isLoading,
  serverError,
  fileError,
  selectedFile,
  previewUrl,
  fileInputRef,
  handleFileSelect,
  handleAvatarClick,
}: AccountSettingsFormViewProps) {
  const watchedName = form.watch("name");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("file", file);
      handleFileSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du compte</CardTitle>
          <CardDescription>
            Gérez vos informations de profil et préférences de compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {(serverError || fileError) && (
                <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
                  {serverError || fileError}
                </div>
              )}

              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <Avatar
                    className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleAvatarClick}
                  >
                    <AvatarImage
                      src={previewUrl || ""}
                      alt={watchedName || "User"}
                    />
                    <AvatarFallback>
                      {watchedName ? getInitials(watchedName) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Photo de profil</p>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur l'avatar pour télécharger une nouvelle photo.
                      {selectedFile && !fileError && (
                        <span className="block text-green-600 mt-1">
                          Fichier sélectionné : {selectedFile.name}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Formats acceptés : JPG, PNG, GIF. Taille max : 1MB.
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom complet" {...field} />
                    </FormControl>
                    <FormDescription>
                      Votre nom tel qu'il apparaîtra dans l'application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || !!fileError}>
                  {isLoading ? "Mise à jour..." : "Sauvegarder"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
});
