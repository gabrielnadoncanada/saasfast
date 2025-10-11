import { vi } from "vitest";

// Mock all server actions with default implementations
export const mockServerActions = {
  // Auth actions
  login: vi.fn(),
  register: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
  githubAuth: vi.fn(),
  googleAuth: vi.fn(),

  // Account actions
  updateAccountSettings: vi.fn(),

  // Tenant actions
  createTenant: vi.fn(),
  deleteTenant: vi.fn(),
  inviteToTenant: vi.fn(),
  acceptInvite: vi.fn(),

  // Tenant members actions
  listTenantMembers: vi.fn(),
  removeTenantMember: vi.fn(),
  updateMemberRole: vi.fn(),

  // User tenant data
  getUserTenantData: vi.fn(),
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  Object.values(mockServerActions).forEach((mock) => mock.mockReset());
};
