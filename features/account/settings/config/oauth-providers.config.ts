import { Github, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Provider } from "@supabase/supabase-js";

export interface OAuthProviderConfig {
  id: Provider;
  name: string;
  icon: LucideIcon;
}

export const OAUTH_PROVIDERS: OAuthProviderConfig[] = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
  },
  {
    id: "google",
    name: "Google",
    icon: Mail,
  },
];
