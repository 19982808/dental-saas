export const CONFIG = {
  appName: "Dental SaaS Pro",

  // =========================
  // ARCHITECTURE
  // =========================
  multiTenant: true,
  requireSubscription: true,
  autoCreateClinic: true,

  // =========================
  // PAYMENTS
  // =========================
  stripeEnabled: true,

  // =========================
  // ENVIRONMENT CONTROL
  // =========================
  environment: "production", // "development" | "production"
  debug: false,
  strictMode: true,

  // =========================
  // UI BEHAVIOR
  // =========================
  showToasts: true,
  showErrorsToUser: false,

  // =========================
  // SAFETY FLAGS (IMPORTANT)
  // =========================
  allowPublicAccess: false,
  enforceRLS: true,

  // =========================
  // PERFORMANCE
  // =========================
  cacheEnabled: true,
  autoRetryRequests: true,
};
