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
import { ForgotPasswordSchema } from "@/features/auth/shared/schema/auth.schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUTH_PATH } from "@/shared/constants/routes";

interface ForgotPasswordFormViewProps {
  form: UseFormReturn<ForgotPasswordSchema>;
  onSubmit: (data: ForgotPasswordSchema) => void;
  isLoading: boolean;
  isSuccess: boolean;
}

export function ForgotPasswordFormView({
  form,
  onSubmit,
  isLoading,
  isSuccess,
}: ForgotPasswordFormViewProps) {
  if (isSuccess) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Email envoyé</CardTitle>
            <CardDescription>
              Vérifiez votre boîte de réception pour réinitialiser votre mot de
              passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Link href={AUTH_PATH} className="text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            Entrez votre email pour recevoir un lien de réinitialisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
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
