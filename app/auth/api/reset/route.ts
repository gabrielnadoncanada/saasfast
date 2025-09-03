import { createClient } from "@/shared/db/supabase/server";
import { type NextRequest } from "next/server";
import { getErrorRedirect, getStatusRedirect } from "@/shared/lib/redirect";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    redirect(
      getErrorRedirect(
        `${requestUrl.origin}/signin/forgot_password`,
        "missing_code",
        "Missing authorization code. Please try again."
      )
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(
      getErrorRedirect(
        `${requestUrl.origin}/signin/forgot_password`,
        error.name ?? "auth_error",
        error.message ??
          "Sorry, we weren't able to log you in. Please try again."
      )
    );
  }

  redirect(
    getStatusRedirect(
      `${requestUrl.origin}/auth/reset-password`,
      "You are now signed in.",
      "Please enter a new password for your account."
    )
  );
}
