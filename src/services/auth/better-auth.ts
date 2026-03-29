import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { env } from "@/constants/env";
import { LOCAL_STORAGE_KEY_PREFIX } from "@/constants/storage";

export const authClient = createAuthClient({
	baseURL: env.EXPO_PUBLIC_BASE_URL,
	basePath: "/api/auth",
	plugins: [
		expoClient({
			scheme: env.EXPO_PUBLIC_SCHEME,
			storagePrefix: LOCAL_STORAGE_KEY_PREFIX,
			storage: SecureStore,
		}),
	],
});
