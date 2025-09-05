import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  accountSettingsSchema,
  AccountSettingsSchema,
} from "@/features/account/settings/schema/settings.schema";
import { updateAccountSettingsAction } from "@/features/account/settings/actions/updateAccountSettings.action";
import { injectFieldErrors } from "@/shared/lib/injectFieldErrors";
import { useToastError } from "@/shared/hooks/useToastError";
import { toast } from "@/components/ui/Toasts/use-toast";
import type { ProfileRow } from "@/shared/db/drizzle/auth";
import { useRouter } from "next/navigation";

interface UseAccountSettingsFormProps {
  initialData?: ProfileRow | null;
}

export function useAccountSettingsForm({
  initialData,
}: UseAccountSettingsFormProps = {}) {
  const { serverError, setServerError, clearServerError } = useToastError();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.avatarUrl || null
  );
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const form = useForm<AccountSettingsSchema>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: initialData?.name || "",
    },
  });

  const handleFileSelect = (file: File) => {
    // Clear previous errors
    setFileError(null);
    clearServerError();

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setFileError("Le fichier doit être une image.");
      return;
    }

    // Validate file size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      setFileError("L'image ne doit pas dépasser 1MB.");
      return;
    }

    setSelectedFile(file);

    // ✅ Use data URL (compatible with: img-src 'self' data: https:)
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string; // "data:image/png;base64,..."
      setPreviewUrl(result);
    };
    reader.onerror = () => {
      setFileError("Impossible de lire le fichier.");
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const onSubmit = async (data: AccountSettingsSchema) => {
    // Prevent submission if there's a file error
    if (fileError) {
      return false;
    }

    clearServerError();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", data.name);
    if (selectedFile) {
      formData.append("avatar", selectedFile);
    }

    const res = await updateAccountSettingsAction(formData);
    setIsLoading(false);

    if (!res.success) {
      setServerError(res.error || "Erreur inconnue");
      injectFieldErrors(form, res.fieldErrors);
      return false;
    }

    // Show success toast
    toast({
      title: "Paramètres mis à jour",
      description: "Vos paramètres de compte ont été mis à jour avec succès.",
    });
    router.refresh();

    // Reset file selection after successful upload
    setSelectedFile(null);
    setFileError(null);

    return true;
  };

  return {
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
  };
}
