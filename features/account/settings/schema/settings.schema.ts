import { z } from "zod";

export const accountSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
});

export type AccountSettingsSchema = z.infer<typeof accountSettingsSchema>;
