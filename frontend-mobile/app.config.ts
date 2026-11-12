import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const allowHttp = process.env.EXPO_PUBLIC_ALLOW_HTTP === "true";
  return {
    ...config,
    name: "الو گیاه",
    slug: "aloogiyah-mobile",
    android: {
      ...config.android,
      ...(process.env.GOOGLE_SERVICES_JSON
        ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON }
        : {}),
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: allowHttp,
          NSAllowsLocalNetworking: allowHttp,
        },
      },
    },
    plugins: [
      ...(config.plugins || []),
      "expo-sharing",
      "expo-video",
      [
        "expo-build-properties",
        { android: { usesCleartextTraffic: allowHttp } },
      ],
    ],
  };
};
