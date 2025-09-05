"use server";

import { eq } from "drizzle-orm";
import { db, profiles } from "@/shared/db/drizzle/db";
import { requireAuth } from "@/shared/db/drizzle/auth";
import { FormResult } from "@/shared/types/api.types";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import { redirect } from "next/navigation";
import { getStatusRedirect } from "@/shared/lib/redirect";
import { ACCOUNT_SETTINGS_PATH } from "@/shared/constants/routes";
import { createClient } from "@/shared/db/supabase/server";
import {
  accountSettingsSchema,
  AccountSettingsSchema,
} from "@/features/account/settings/schema/settings.schema";

// Helper function to delete old avatar from storage
async function deleteOldAvatar(avatarUrl: string): Promise<void> {
  if (!avatarUrl || !avatarUrl.includes("supabase")) return;

  try {
    const supabase = await createClient();
    // Extract file path from URL
    const urlParts = avatarUrl.split("/");
    // Get the path after the bucket name in the URL
    const pathIndex = urlParts.findIndex((part) => part === "avatars");
    if (pathIndex !== -1 && pathIndex < urlParts.length - 1) {
      const filePath = urlParts.slice(pathIndex + 1).join("/");
      await supabase.storage.from("avatars").remove([filePath]);
    }
  } catch (error) {
    console.warn("Failed to delete old avatar:", error);
    // Don't throw error, just log warning as this is not critical
  }
}

// Helper function to upload file to Supabase storage
async function uploadAvatarToStorage(
  file: File,
  userId: string
): Promise<string> {
  const supabase = await createClient();

  // Generate a unique filename with proper folder structure
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `public/${fileName}`; // Add public folder for better organization

  // Convert File to ArrayBuffer for upload
  const arrayBuffer = await file.arrayBuffer();

  // Upload file to Supabase storage
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false, // Don't overwrite, create new file each time
    });

  if (error) {
    console.error("Supabase storage error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get the public URL
  const { data: publicData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}

export async function updateAccountSettingsAction(
  formData: FormData
): Promise<FormResult<AccountSettingsSchema>> {
  const parsed = await safeParseForm<AccountSettingsSchema>(
    formData,
    accountSettingsSchema
  );
  if (!parsed.success) return parsed;

  const { name } = parsed.data;
  const avatarFile = formData.get("avatar") as File | null;

  try {
    // Get current user
    const currentUser = await requireAuth();

    let avatarUrl: string | null = null;

    // Handle avatar file upload if provided
    if (avatarFile && avatarFile.size > 0) {
      // Validate file type
      if (!avatarFile.type.startsWith("image/")) {
        return {
          success: false,
          error: "Le fichier doit être une image.",
        };
      }

      // Validate file size (5MB max)
      if (avatarFile.size > 1 * 1024 * 1024) {
        return {
          success: false,
          error: "L'image ne doit pas dépasser 1MB.",
        };
      }

      try {
        // Delete old avatar if it exists
        if (currentUser.profile?.avatarUrl) {
          await deleteOldAvatar(currentUser.profile.avatarUrl);
        }

        // Upload to Supabase storage
        avatarUrl = await uploadAvatarToStorage(
          avatarFile,
          currentUser.authUser.id
        );
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return {
          success: false,
          error:
            "Erreur lors du téléchargement de l'image. Veuillez réessayer.",
        };
      }
    }

    // Update the profile
    const updateData: { name: string; avatarUrl?: string | null } = { name };
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl;
    }

    await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, currentUser.authUser.id));

    // Return success instead of redirecting
    return {
      success: true,
      data: { name },
    };
  } catch (error) {
    // Check if this is a redirect error (which is expected)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      // Re-throw redirect errors so they work properly
      throw error;
    }

    console.error("Error updating account settings:", error);
    return {
      success: false,
      error: "Une erreur est survenue lors de la mise à jour des paramètres.",
    };
  }
}
