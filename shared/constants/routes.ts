export const DASHBOARD_PATH = "/dashboard";
export const PROFILE_PATH = "/dashboard/profile";
export const CLIENTS_PATH = "/dashboard/clients";
export const TIME_TRACKING_PATH = "/dashboard/time-tracking";
export const INVOICES_PATH = "/dashboard/invoices";
export const invoicePath = (invoiceId: string) =>
  `/dashboard/invoices/${invoiceId}`;
export const PROJECTS_PATH = "/dashboard/projects";
export const projectPath = (projectId: string) =>
  `/dashboard/projects/${projectId}`;
export const PRODUCTS_PATH = "/dashboard/products";
export const productPath = (productId: string) =>
  `/dashboard/products/${productId}`;
export const PRODUCT_CATEGORIES_PATH = "/dashboard/products/categories";
export const PAYMENTS_PATH = "/dashboard/payments";

export const AUTH_PATH = "/auth";
export const REGISTER_PATH = `${AUTH_PATH}/register`;
export const FORGOT_PASSWORD_PATH = `${AUTH_PATH}/forgot-password`;
export const RESET_PASSWORD_PATH = `${AUTH_PATH}/reset-password`;
