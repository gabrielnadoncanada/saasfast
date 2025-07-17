import { z } from "zod";

export const registerSchema = z.object({
  email: z.email("Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
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
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
export type ResendConfirmationSchema = z.infer<typeof resendConfirmationSchema>;
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
