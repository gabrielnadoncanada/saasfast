# Import Conventions

Conventions strictes pour les imports dans le projet SaasFast

## Règles Obligatoires

### 1. Utilisation de l'alias `@/`

**TOUJOURS** utiliser l'alias `@/` pour les imports internes au projet. **JAMAIS** de chemins relatifs avec `../../../`.

```typescript
// ✅ CORRECT
import { mockFormState } from "@/__tests__/setup/test-utils";
import { isUserOwnerOrAdmin } from "@/features/tenant/shared/lib/tenant";
import { useToastError } from "@/shared/hooks/useToastError";

// ❌ INCORRECT
import { mockFormState } from "../../../../__tests__/setup/test-utils";
import { isUserOwnerOrAdmin } from "../../../tenant/shared/lib/tenant";
import { useToastError } from "../../../shared/hooks/useToastError";
```

### 2. Organisation des imports

Respecter cet ordre strict avec des lignes vides entre chaque groupe :

```typescript
// 1. React et Next.js
import { useActionState } from "react";
import { redirect } from "next/navigation";

// 2. Bibliothèques tierces
import { useForm } from "react-hook-form";
import { z } from "zod";

// 3. Actions et hooks de la feature courante (imports relatifs autorisés)
import { myAction } from "./actions/my.action";
import { useMyForm } from "../hooks/useMyForm";

// 4. Autres features (avec @/)
import { getUserTenantData } from "@/features/auth/shared/actions/getUserTenantData.action";

// 5. Shared (avec @/)
import { useToastError } from "@/shared/hooks/useToastError";
import { safeParseForm } from "@/shared/lib/safeParseForm";

// 6. Types (toujours en dernier)
import type { FormResult } from "@/shared/types/api.types";
```

### 3. Imports relatifs autorisés

Les imports relatifs sont **uniquement** autorisés pour :

- Fichiers dans le même dossier : `./file`
- Fichiers dans un dossier parent direct : `../hooks/useMyHook`

```typescript
// ✅ AUTORISÉ - même dossier
import { MyComponent } from "./MyComponent";

// ✅ AUTORISÉ - dossier parent direct
import { useMyForm } from "../hooks/useMyForm";
import { MyAction } from "../actions/my.action";

// ❌ INTERDIT - plus d'un niveau
import { something } from "../../shared/lib/utils";
```

### 4. Conventions spécifiques

#### Tests

```typescript
// ✅ Imports de test utilities
import { render, screen } from "@testing-library/react";
import {
  mockFormState,
  ActionResponseBuilder,
} from "@/__tests__/setup/test-utils";
```

#### Server Actions

```typescript
// ✅ Structure typique d'une Server Action
"use server";

import { db } from "@/shared/db/drizzle/db";
import { requireTenantContext } from "@/features/auth/shared/actions/getUserTenantData.action";
import { safeParseForm } from "@/shared/lib/safeParseForm";
import type { FormResult } from "@/shared/types/api.types";
```

#### Components

```typescript
// ✅ Structure typique d'un composant
import { useActionState } from "react";
import { useForm } from "react-hook-form";

import { myAction } from "../actions/my.action";
import { useToastError } from "@/shared/hooks/useToastError";
```

## Configuration TypeScript

L'alias `@/` est configuré dans `tsconfig.json` :

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Avantages

- **Lisibilité** : Imports clairs et compréhensibles
- **Maintenabilité** : Refactoring facilité
- **Cohérence** : Même pattern partout
- **Performance** : Résolution plus rapide par TypeScript
