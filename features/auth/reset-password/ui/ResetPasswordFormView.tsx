import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { UseFormReturn } from "react-hook-form";
import { ResetPasswordSchema } from "@/features/auth/shared/schema/auth.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTH_PATH } from "@/shared/constants/routes";

interface ResetPasswordFormViewProps {
  form: UseFormReturn<ResetPasswordSchema>;
  onSubmit: (data: ResetPasswordSchema) => void;
  serverError: string | null;
  isLoading: boolean;
}

export function ResetPasswordFormView({
  form,
  onSubmit,
  serverError,
  isLoading,
}: ResetPasswordFormViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Entrez votre nouveau mot de passe pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {serverError && (
                <div className="mb-2 text-sm text-destructive font-medium">
                  {serverError}
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </Button>

              <div className="text-center text-sm">
                Vous vous souvenez de votre mot de passe?{" "}
                <Link href={AUTH_PATH} className="text-primary hover:underline">
                  Se connecter
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
