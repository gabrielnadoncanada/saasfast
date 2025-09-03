import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(12, "Le mot de passe doit contenir au moins 12 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[^A-Za-z0-9]/,
      "Le mot de passe doit contenir au moins un caractère spécial"
    ),
  full_name: z.string().min(2, "Le nom complet est requis"),
});

export const loginSchema = z.object({
  email: z.email("Email invalide"),
  password: z.string().min(6, "Mot de passe requis"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Email invalide"),
});

export const resendConfirmationSchema = z.object({
  email: z.email("Email invalide"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(10, "Le mot de passe doit contenir au moins 10 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre")
    .regex(
      /[^A-Za-z0-9]/,
      "Le mot de passe doit contenir au moins un caractère spécial"
    ),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResendConfirmationSchema = z.infer<typeof resendConfirmationSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
