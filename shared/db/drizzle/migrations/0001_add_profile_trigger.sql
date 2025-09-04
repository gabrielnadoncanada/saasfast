-- Fonction : crée/complète le profil à la création d'un user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name   text;
  v_avatar text;
  v_email  text;
  -- on choisit une identité non "email" en priorité (github > google > autres)
  v_ident jsonb;
begin
  -- email depuis auth.users (existe chez Supabase, même si ta définition Drizzle ne l’expose pas)
  v_email := new.email;

  -- 1) Essayez user metadata
  v_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    (coalesce(new.raw_user_meta_data ->> 'given_name','') || ' ' || coalesce(new.raw_user_meta_data ->> 'family_name',''))
  );
  v_name := nullif(btrim(v_name), '');

  v_avatar := coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  );
  v_avatar := nullif(btrim(v_avatar), '');

  -- 2) Si rien en metadata, regarder l'identité la plus pertinente
  if v_name is null or v_avatar is null then
    select i.identity_data
    into v_ident
    from auth.identities i
    where i.user_id = new.id
    order by
      case i.provider
        when 'github' then 1
        when 'google' then 2
        else 100
      end
    limit 1;

    if v_ident is not null then
      if v_name is null then
        v_name := coalesce(
          v_ident ->> 'name',
          v_ident ->> 'full_name',
          v_ident ->> 'user_name'
        );
        v_name := nullif(btrim(v_name), '');
      end if;

      if v_avatar is null then
        v_avatar := coalesce(
          v_ident ->> 'avatar_url',
          v_ident ->> 'picture'
        );
        v_avatar := nullif(btrim(v_avatar), '');
      end if;
    end if;
  end if;

  -- 3) Fallbacks : nom = avant @ ; avatar = Dicebear initials
  if v_name is null then
    if v_email is not null then
      v_name := split_part(v_email, '@', 1);
    else
      v_name := new.id::text; -- ultime fallback
    end if;
  end if;

  if v_avatar is null then
    -- avatar placeholder basé sur le nom (pas besoin d’extensions)
    v_avatar := 'https://api.dicebear.com/7.x/initials/svg?seed=' || replace(v_name, ' ', '+');
  end if;

  -- 4) Insérer le profil si absent, sinon compléter SANS écraser
  insert into public.profiles ("id", "name", "avatarUrl", "createdAt")
  values (new.id, left(v_name, 255), left(v_avatar, 500), now())
  on conflict (id) do update
    set "name"      = coalesce(public.profiles."name", excluded."name"),
        "avatarUrl" = coalesce(public.profiles."avatarUrl", excluded."avatarUrl");

  return new;
end;
$$;

-- Trigger idempotent
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
