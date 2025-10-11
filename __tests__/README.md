# Guide des Tests

Ce guide explique comment organiser et écrire des tests dans ce projet qui suit l'architecture Feature-Sliced Design.

## 🏗️ Structure des Tests

### Tests des Features

```
features/
├── {domain}/
│   ├── {slice}/
│   │   └── __tests__/           # Tests spécifiques à cette slice
│   │       ├── {hook}.test.ts   # Tests des hooks
│   │       ├── {action}.test.ts # Tests des server actions
│   │       └── {Component}.test.tsx # Tests des composants
```

### Tests Partagés

```
shared/
├── hooks/
│   └── __tests__/              # Tests des hooks partagés
├── lib/
│   └── __tests__/              # Tests des utilitaires
└── db/
    └── __tests__/              # Tests de la base de données
```

### Tests d'Intégration

```
__tests__/                      # À la racine du projet
├── integration/                # Tests d'intégration
├── e2e/                       # Tests end-to-end
└── setup/                     # Configuration et utilitaires de test
    ├── test-utils.tsx         # Utilitaires de rendu et mocks
    └── mocks/                 # Mocks partagés
```

## 🛠️ Configuration

### Fichiers de Configuration

- `vitest.setup.ts` - Configuration globale des tests
- `vite.config.ts` - Configuration Vitest
- `__tests__/setup/test-utils.tsx` - Utilitaires de test personnalisés

### Scripts Disponibles

```bash
npm test              # Mode interactif
npm run test:run      # Exécution unique
npm run test:watch    # Mode watch
npm run test:coverage # Avec couverture de code
```

## 📝 Patterns de Test

### 1. Tests de Hooks

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "../useMyHook";

// Mocks avec vi.hoisted pour éviter les problèmes de hoisting
const { mockFunction } = vi.hoisted(() => ({
  mockFunction: vi.fn(),
}));

vi.mock("../dependency", () => ({
  dependency: mockFunction,
}));

describe("useMyHook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with correct values", () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(expectedValue);
  });
});
```

### 2. Tests de Composants

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "../MyComponent";

// Mock des hooks utilisés
vi.mock("../hooks/useMyHook", () => ({
  useMyHook: () => ({
    data: mockData,
    isLoading: false,
  }),
}));

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### 3. Tests de Server Actions

```typescript
import { describe, it, expect, vi } from "vitest";
import { myAction } from "../myAction";

// Mock des dépendances
vi.mock("@/shared/db/supabase/server", () => ({
  createClient: () => mockSupabaseClient,
}));

describe("myAction", () => {
  it("should handle successful action", async () => {
    const formData = new FormData();
    formData.append("field", "value");

    const result = await myAction(formData);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(expectedData);
  });
});
```

## 🎯 Bonnes Pratiques

### Mocking

1. **Utilisez `vi.hoisted()`** pour les variables utilisées dans les mocks
2. **Mockez au niveau approprié** - ne pas over-mocker
3. **Réinitialisez les mocks** dans `beforeEach`

### Organisation

1. **Co-localisez les tests** avec le code testé
2. **Groupez par fonctionnalité** dans les `describe`
3. **Nommez clairement** les tests avec "should..."

### Assertions

1. **Testez le comportement**, pas l'implémentation
2. **Utilisez des matchers spécifiques** (`toBeInTheDocument`, `toHaveBeenCalledWith`)
3. **Vérifiez les cas d'erreur** autant que les cas de succès

## 🔧 Utilitaires Disponibles

### Test Utils

- `render()` - Rendu avec providers mockés
- `mockActionSuccess()` - Mock de réponse d'action réussie
- `mockActionError()` - Mock de réponse d'action échouée
- `createMockAction()` - Créateur de mock d'action

### Mocks Globaux

- Next.js router
- Supabase client
- React hooks (useActionState, etc.)

## 🚀 Ajout de Nouveaux Tests

1. **Créez le dossier `__tests__`** dans la slice appropriée
2. **Suivez les conventions de nommage** : `{feature}.test.{ts|tsx}`
3. **Importez les utilitaires** depuis `__tests__/setup/test-utils`
4. **Mockez les dépendances** avec `vi.hoisted()` si nécessaire
5. **Écrivez des tests descriptifs** avec des assertions claires

## 📊 Couverture de Code

Pour générer un rapport de couverture :

```bash
npm run test:coverage
```

Le rapport sera généré dans le dossier `coverage/`.
