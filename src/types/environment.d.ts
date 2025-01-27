declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Base URLs
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_GRAPHQL_URL: string;
      NEXT_PUBLIC_APP_URL: string;

      // Authentication
      JWT_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      ACCESS_TOKEN_EXPIRES_IN: string;
      REFRESH_TOKEN_EXPIRES_IN: string;

      // Third Party Services
      NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?: string;
      NEXT_PUBLIC_SENTRY_DSN?: string;

      // Environment
      NODE_ENV: "development" | "production" | "test";
      NEXT_PUBLIC_ENV: "development" | "staging" | "production";
    }
  }
}

export {};
