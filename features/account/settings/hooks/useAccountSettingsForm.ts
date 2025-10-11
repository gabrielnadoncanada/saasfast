import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  accountSettingsSchema,
  AccountSettingsSchema,
} from "@/features/account/settings/schema/settings.schema";
import { updateAccountSettingsAction } from "@/features/account/settings/actions/updateAccountSettings.action";
import { useFormActionWithFiles } from "@/shared/hooks/useFormActionWithFiles";
import { toast } from "@/components/ui/Toasts/use-toast";
import type { ProfileRow } from "@/shared/db/drizzle/auth";
import { useRouter } from "next/navigation";

interface UseAccountSettingsFormProps {
  initialData?: ProfileRow | null;
}

export function useAccountSettingsForm({
  initialData,
}: UseAccountSettingsFormProps = {}) {
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

  const { submitFormWithFiles, isLoading, actionState } =
    useFormActionWithFiles(updateAccountSettingsAction, form);

  useEffect(() => {
    if (actionState?.success) {
      toast({
        title: "Paramètres mis à jour",
        description: "Vos paramètres de compte ont été mis à jour avec succès.",
      });
      router.refresh();
      setSelectedFile(null);
      setFileError(null);
    }
  }, [actionState, router]);

  const handleFileSelect = (file: File) => {
    // Clear previous errors
    setFileError(null);

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

  const onSubmit = (data: AccountSettingsSchema) => {
    // Prevent submission if there's a file error
    if (fileError) {
      return;
    }

    const files = selectedFile ? { avatar: selectedFile } : undefined;
    submitFormWithFiles(data, files);
  };

  return {
    form,
    onSubmit,
    isLoading,
    fileError,
    selectedFile,
    previewUrl,
    fileInputRef,
    handleFileSelect,
    handleAvatarClick,
    actionState,
  };
}
