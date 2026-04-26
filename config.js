export const CONFIG = {
  appName: "Dental SaaS Pro",

  // Core architecture
  multiTenant: true,

  // Payments
  stripeEnabled: true,

  // API / stability flags (IMPORTANT for debugging)
  debug: false,
  strictMode: true,

  // Safety defaults (prevents runtime crashes)
  autoCreateClinic: true,
  requireSubscription: true,

  // UI behavior
  showToasts: true,
};
