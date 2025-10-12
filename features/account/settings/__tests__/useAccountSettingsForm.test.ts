import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAccountSettingsForm } from "@/features/account/settings/hooks/useAccountSettingsForm";
import { mockActionSuccess } from "@/__tests__/setup/test-utils";

// Mock dependencies
vi.mock("@/shared/hooks/useFormActionWithFiles.ts", () => ({
  useFormActionWithFiles: vi.fn(),
}));

vi.mock("@/features/account/settings/actions/updateAccountSettings.action.ts", () => ({
  updateAccountSettingsAction: vi.fn(),
}));

vi.mock("react-hook-form", () => ({
  useForm: vi.fn(),
}));

vi.mock("@hookform/resolvers/zod", () => ({
  zodResolver: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/ui/Toasts/use-toast", () => ({
  toast: vi.fn(),
}));

describe("useAccountSettingsForm", () => {
  const mockForm = {
    handleSubmit: vi.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true,
    },
    register: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
  };

  const mockSubmitFormWithFiles = vi.fn();
  const mockRefresh = vi.fn();
  const mockUseFormActionWithFiles = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    // Mock useForm
    const { useForm } = await import("react-hook-form");
    vi.mocked(useForm).mockReturnValue(mockForm as any);

    // Mock useFormActionWithFiles
    const { useFormActionWithFiles } = await import("@/shared/hooks/useFormActionWithFiles");
    mockUseFormActionWithFiles.mockReturnValue({
      submitFormWithFiles: mockSubmitFormWithFiles,
      isLoading: false,
      actionState: null,
    });
    vi.mocked(useFormActionWithFiles).mockImplementation(mockUseFormActionWithFiles);

    // Mock useRouter
    const { useRouter } = await import("next/navigation");
    vi.mocked(useRouter).mockReturnValue({
      refresh: mockRefresh,
    } as any);
  });

  it("should initialize with user data", () => {
    const initialData = {
      id: "user-123",
      name: "Test User",
      avatarUrl: "https://example.com/avatar.png",
    };

    const { result } = renderHook(() =>
      useAccountSettingsForm({ initialData: initialData as any })
    );

    expect(result.current.form).toBe(mockForm);
    expect(result.current.previewUrl).toBe("https://example.com/avatar.png");
  });

  it("should handle file selection", () => {
    const { result } = renderHook(() => useAccountSettingsForm());

    const mockFile = new File(["avatar"], "avatar.png", { type: "image/png" });

    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(result.current.selectedFile).toBe(mockFile);
    expect(result.current.fileError).toBeNull();
  });

  it("should validate file type and size", () => {
    const { result } = renderHook(() => useAccountSettingsForm());

    // Test invalid file type
    const invalidFile = new File(["text"], "file.txt", { type: "text/plain" });

    act(() => {
      result.current.handleFileSelect(invalidFile);
    });

    expect(result.current.fileError).toContain("image");
    expect(result.current.selectedFile).toBeNull();

    // Test file too large
    const largeFile = new File([new ArrayBuffer(2 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });

    act(() => {
      result.current.handleFileSelect(largeFile);
    });

    expect(result.current.fileError).toContain("1MB");
  });

  it("should generate preview URL", async () => {
    const { result } = renderHook(() => useAccountSettingsForm());

    const mockFile = new File(["avatar"], "avatar.png", { type: "image/png" });

    // Mock FileReader
    const mockReadAsDataURL = vi.fn();
    global.FileReader = vi.fn().mockImplementation(() => ({
      readAsDataURL: mockReadAsDataURL,
      onload: null,
      onerror: null,
      result: "data:image/png;base64,mock",
    })) as any;

    act(() => {
      result.current.handleFileSelect(mockFile);
    });

    expect(mockReadAsDataURL).toHaveBeenCalledWith(mockFile);
  });

  it("should show success toast", async () => {
    const { toast } = await import("@/components/ui/Toasts/use-toast");

    const successState = mockActionSuccess({ name: "New Name" });
    mockUseFormActionWithFiles.mockReturnValue({
      submitFormWithFiles: mockSubmitFormWithFiles,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useAccountSettingsForm());

    expect(toast).toHaveBeenCalledWith({
      title: "Paramètres mis à jour",
      description: expect.any(String),
    });
  });

  it("should refresh router on success", () => {
    const successState = mockActionSuccess({ name: "New Name" });
    mockUseFormActionWithFiles.mockReturnValue({
      submitFormWithFiles: mockSubmitFormWithFiles,
      isLoading: false,
      actionState: successState,
    });

    renderHook(() => useAccountSettingsForm());

    expect(mockRefresh).toHaveBeenCalled();
  });
});
