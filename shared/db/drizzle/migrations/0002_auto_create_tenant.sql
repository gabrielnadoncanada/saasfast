-- Fonction : crée automatiquement un tenant et un tenant profile à la création d'un user
create or replace function public.handle_new_user_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id    uuid;
  v_user_name    text;
  v_user_email   text;
  v_business_name text;
begin
  -- Récupérer les informations du profil utilisateur nouvellement créé
  select "name" into v_user_name 
  from public.profiles 
  where id = new.id;
  
  -- Récupérer l'email depuis auth.users
  select email into v_user_email 
  from auth.users 
  where id = new.id;
  
  -- Définir le nom du workspace (fallback sur le nom utilisateur ou email)
  v_business_name := coalesce(
    v_user_name || '''s Workspace',
    split_part(v_user_email, '@', 1) || '''s Workspace',
    'My Workspace'
  );
  
  -- 1) Créer le tenant avec l'utilisateur comme owner
  insert into public.tenants (
    "name", 
    "ownerId", 
    "plan",
    "createdAt",
    "updatedAt"
  )
  values (
    left(v_business_name, 255),
    new.id,
    'FREE',
    now(),
    now()
  )
  returning id into v_tenant_id;
  
  -- 2) Créer le membership OWNER pour l'utilisateur
  insert into public.memberships (
    "userId",
    "tenantId", 
    "role",
    "status",
    "createdAt"
  )
  values (
    new.id,
    v_tenant_id,
    'OWNER',
    'ACTIVE',
    now()
  );
  
  -- 3) Mettre à jour le profil utilisateur avec le tenant par défaut
  update public.profiles
  set "currentTenantId" = v_tenant_id
  where id = new.id;
  
  return new;
end;
$$;

-- Trigger idempotent pour créer tenant après création du profil
drop trigger if exists on_profile_created_create_tenant on public.profiles;
create trigger on_profile_created_create_tenant
after insert on public.profiles
for each row execute function public.handle_new_user_tenant();
