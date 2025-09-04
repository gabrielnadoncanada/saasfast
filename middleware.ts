import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/shared/db/supabase/middleware";
import {
  DASHBOARD_PATH,
  AUTH_PATH,
  RESET_PASSWORD_PATH,
  AUTH_CALLBACK_PATH,
} from "@/shared/constants/routes";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    `${DASHBOARD_PATH}/:path*`,
    `${AUTH_PATH}/:path*`,
    RESET_PASSWORD_PATH,
    AUTH_CALLBACK_PATH,
  ],
};
