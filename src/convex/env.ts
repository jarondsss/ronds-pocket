/**
 * Environment variable validation and helper functions.
 * Validates required secrets on startup to prevent runtime errors.
 */

export function getRequiredEnv(key: string, context: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(
      `[Security] Missing required environment variable: ${key} (needed for ${context})`
    );
    throw new Error(`Konfigurasi sistem belum lengkap. Hubungi administrator.`);
  }
  return value;
}

export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Get environment variable with fallback, but log warning in production
 */
export function getEnvWithWarning(
  key: string,
  fallback: string,
  feature: string
): string {
  const value = process.env[key];
  if (!value) {
    if (isProduction()) {
      console.warn(
        `[Security] ${key} not set in production. Feature '${feature}' may not work.`
      );
    }
    return fallback;
  }
  return value;
}

/**
 * Validate all required environment variables at startup.
 * Call this from a setup function that runs once.
 */
export function validateEnvironment() {
  const requiredVars = [
    { key: "CONVEX_SITE_URL", context: "authentication" },
  ];

  const optionalButRecommended = [
    { key: "VLY_INTEGRATION_KEY", feature: "email OTP" },
    { key: "RESEND_API_KEY", feature: "feedback emails" },
    { key: "GEMINI_API_KEY", feature: "AI features" },
  ];

  let hasErrors = false;

  // Check required variables
  for (const { key, context } of requiredVars) {
    if (!process.env[key]) {
      console.error(
        `[Security] REQUIRED: ${key} is not set (needed for ${context})`
      );
      hasErrors = true;
    }
  }

  // Warn about optional variables in production
  if (isProduction()) {
    for (const { key, feature } of optionalButRecommended) {
      if (!process.env[key]) {
        console.warn(
          `[Config] Optional: ${key} not set. ${feature} will not be available.`
        );
      }
    }
  }

  if (hasErrors) {
    throw new Error(
      "Critical environment variables are missing. Check server logs."
    );
  }
}
