import { NextResponse } from "next/server";
import { createClient } from "@/shared/api/supabase/server";
import { getStatusRedirect, getErrorRedirect } from "@/shared/lib/redirect";
import { DASHBOARD_PATH } from "@/shared/constants/routes";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? DASHBOARD_PATH;
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = DASHBOARD_PATH;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(
          `${origin}${getStatusRedirect(
            next,
            "Connexion réussie",
            "Vous êtes maintenant connecté avec GitHub."
          )}`
        );
      } else if (forwardedHost) {
        return NextResponse.redirect(
          `https://${forwardedHost}${getStatusRedirect(
            next,
            "Connexion réussie",
            "Vous êtes maintenant connecté avec GitHub."
          )}`
        );
      } else {
        return NextResponse.redirect(
          `${origin}${getStatusRedirect(
            next,
            "Connexion réussie",
            "Vous êtes maintenant connecté avec GitHub."
          )}`
        );
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}${getErrorRedirect(
      "/auth",
      "auth_callback_error",
      "Erreur lors de l'authentification. Veuillez réessayer."
    )}`
  );
}
