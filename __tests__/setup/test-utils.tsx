import React, { ReactElement } from "react";
import { render, RenderOptions, renderHook } from "@testing-library/react";
import { vi, expect } from "vitest";
import userEvent from "@testing-library/user-event";

// 1. Factory functions pour des mocks flexibles
export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  user_metadata: {
    full_name: "Test User",
    avatar_url: null,
  },
  ...overrides,
});

export const createMockTenant = (overrides = {}) => ({
  id: "test-tenant-id",
  name: "Test Tenant",
  slug: "test-tenant",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Backward compatibility
export const mockUser = createMockUser();
export const mockTenant = createMockTenant();
export const mockUserTenantData = {
  user: mockUser,
  tenants: [mockTenant],
  currentTenant: mockTenant,
};

// 2. Provider wrapper plus flexible
interface TestProviderProps {
  children: React.ReactNode;
  user?: any;
  tenant?: any;
  theme?: "light" | "dark";
}

const TestProvider: React.FC<TestProviderProps> = ({
  children,
  user = mockUser,
  tenant = mockTenant,
  theme = "light",
}) => {
  return (
    <div
      data-testid="test-provider"
      data-theme={theme}
      data-user={user?.id}
      data-tenant={tenant?.id}
    >
      {children}
    </div>
  );
};

// 3. Custom render avec options étendues
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  user?: any;
  tenant?: any;
  theme?: "light" | "dark";
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { user: mockUserData, tenant, theme, ...renderOptions } = options;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <TestProvider user={mockUserData} tenant={tenant} theme={theme}>
      {children}
    </TestProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });
  const userEvents = userEvent.setup();

  return {
    ...renderResult,
    user: userEvents,
  };
};

// 4. Builder pattern pour les réponses d'actions
export class ActionResponseBuilder {
  private response: any = {
    success: true,
    data: null,
    error: null,
    fieldErrors: {},
  };

  static success<T>(data?: T) {
    return new ActionResponseBuilder().withSuccess(data);
  }

  static error(message: string) {
    return new ActionResponseBuilder().withError(message);
  }

  withSuccess<T>(data?: T) {
    this.response.success = true;
    this.response.data = data;
    this.response.error = null;
    return this;
  }

  withError(message: string) {
    this.response.success = false;
    this.response.error = message;
    this.response.data = null;
    return this;
  }

  withFieldErrors(fieldErrors: Record<string, string[]>) {
    this.response.fieldErrors = fieldErrors;
    return this;
  }

  build() {
    return this.response;
  }
}

// Backward compatibility - fonctions simples
export const mockActionSuccess = <T,>(data: T) => ({
  success: true,
  data,
  error: null,
  fieldErrors: {},
});

export const mockActionError = (
  message: string,
  fieldErrors: Record<string, string[]> = {}
) => ({
  success: false,
  data: null,
  error: message,
  fieldErrors,
});

// Mock form state for React Hook Form
export const mockFormState = {
  isDirty: false,
  isLoading: false,
  isSubmitting: false,
  isSubmitSuccessful: false,
  isValid: true,
  errors: {},
  touchedFields: {},
  dirtyFields: {},
  defaultValues: {},
};

// 5. Mock factories avec reset automatique
export const createMockFactory = () => {
  const mocks = new Set<any>();

  const createMock = <T extends (...args: any[]) => any>(
    implementation?: T
  ) => {
    const mock = vi.fn(implementation);
    mocks.add(mock);
    return mock;
  };

  const resetAll = () => {
    mocks.forEach((mock) => mock.mockReset());
  };

  return { createMock, resetAll };
};

// 6. Hook testing utilities
export const createHookTester = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  defaultProps?: TProps
) => {
  return {
    render: (props?: Partial<TProps>) => {
      const finalProps = { ...defaultProps, ...props } as TProps;
      return renderHook(() => hook(finalProps));
    },

    renderWithUser: (props?: Partial<TProps>) => {
      const finalProps = { ...defaultProps, ...props } as TProps;
      const user = userEvent.setup();
      const result = renderHook(() => hook(finalProps));
      return { ...result, user };
    },
  };
};

// 7. Assertion helpers
export const expectToastMessage = (
  message: string,
  variant: "success" | "error" | "destructive" = "destructive"
) => {
  return expect.objectContaining({
    title: expect.any(String),
    description: message,
    variant,
  });
};

// Backward compatibility
export const createMockAction = <TInput, TOutput>(mockResponse: any) => {
  return vi.fn().mockResolvedValue(mockResponse);
};

// Re-export everything from testing library
export * from "@testing-library/react";
export { customRender as render };
export { userEvent };
export { vi, expect } from "vitest";
