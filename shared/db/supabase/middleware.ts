import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DASHBOARD_PATH,
  AUTH_PATH,
  RESET_PASSWORD_PATH,
} from "@/shared/constants/routes";

function withSupabaseCookies(
  base: NextResponse,
  supabaseResponse: NextResponse
) {
  supabaseResponse.cookies.getAll().forEach((c) => base.cookies.set(c));
  return base;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthed = !!user && !error;
  const path = request.nextUrl.pathname;

  if (path.startsWith(DASHBOARD_PATH) && !isAuthed) {
    return withSupabaseCookies(
      NextResponse.redirect(new URL(AUTH_PATH, request.url)),
      supabaseResponse
    );
  }

  if (path === RESET_PASSWORD_PATH) {
    return supabaseResponse;
  }

  if (path.startsWith(AUTH_PATH) && isAuthed) {
    return withSupabaseCookies(
      NextResponse.redirect(new URL(DASHBOARD_PATH, request.url)),
      supabaseResponse
    );
  }

  return supabaseResponse;
}
