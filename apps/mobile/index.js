// Entry point — required because the "main" field in package.json points to expo-router/entry
// Expo Router needs to know where the `app` directory is.
process.env.EXPO_ROUTER_APP_ROOT = "./src/app"

import "expo-router/entry"
