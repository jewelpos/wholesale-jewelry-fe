interface EnvironmentConfig {
  apiUrl: string;
  graphqlUrl: string;
  appUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
  basePath: string;
  analytics: {
    googleAnalyticsId?: string;
    sentryDsn?: string;
  };
  auth: {
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
  };
  features: {
    newUi: boolean;
    maintenanceMode: boolean;
  };
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL!,
    appUrl: process.env.NEXT_PUBLIC_APP_URL!,
    isProduction: process.env.NEXT_PUBLIC_ENV === "production",
    isDevelopment: process.env.NEXT_PUBLIC_ENV === "development",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH!,
    analytics: {
      googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    auth: {
      accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN!,
      refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN!,
    },
    features: {
      newUi: process.env.NEXT_PUBLIC_FEATURE_FLAG_NEW_UI === "true",
      maintenanceMode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
    },
  };
};
