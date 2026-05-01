import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { LOCAL_STORAGE_KEY_PREFIX } from "@/constants/storage";
import {
	registerPushToken,
	unregisterPushToken,
} from "@/hooks/use-notifications";
import { storage } from "@/hooks/use-local-storage";
import type { PushPlatform } from "@/types/notification";

const PUSH_TOKEN_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}expo-push-token`;
const PUSH_NOTIFICATION_CHANNEL_ID = "appointments";

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

const getProjectId = () => {
	const expoProjectId =
		Constants.expoConfig?.extra?.eas?.projectId ??
		Constants.easConfig?.projectId;

	return typeof expoProjectId === "string" ? expoProjectId : null;
};

export const getPushPlatform = (): PushPlatform => {
	if (Platform.OS === "ios") {
		return "IOS";
	}

	if (Platform.OS === "android") {
		return "ANDROID";
	}

	if (Platform.OS === "web") {
		return "WEB";
	}

	return "UNKNOWN";
};

export const registerForPushNotificationsAsync = async (options?: {
	requestPermission?: boolean;
}) => {
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync(
			PUSH_NOTIFICATION_CHANNEL_ID,
			{
				name: "Appointments",
				importance: Notifications.AndroidImportance.DEFAULT,
				vibrationPattern: [0, 250, 250, 250],
				lightColor: "#208AEF",
			},
		);
	}

	if (!Device.isDevice) {
		return null;
	}

	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted" && options?.requestPermission) {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== "granted") {
		return null;
	}

	const projectId = getProjectId();

	if (!projectId) {
		throw new Error("Expo project id is required to register push notifications.");
	}

	const token = await Notifications.getExpoPushTokenAsync({ projectId });

	return token.data;
};

export const syncPushTokenWithBackend = async (options?: {
	force?: boolean;
	requestPermission?: boolean;
}) => {
	const token = await registerForPushNotificationsAsync({
		requestPermission: options?.requestPermission,
	});

	if (!token) {
		return null;
	}

	const previousToken = storage.getString(PUSH_TOKEN_STORAGE_KEY);

	if (!options?.force && previousToken === token) {
		return token;
	}

	await registerPushToken({
		token,
		platform: getPushPlatform(),
		deviceId: Constants.sessionId,
	});

	storage.set(PUSH_TOKEN_STORAGE_KEY, token);

	return token;
};

export const hasRegisteredPushToken = () => {
	return Boolean(storage.getString(PUSH_TOKEN_STORAGE_KEY));
};

export const unregisterCurrentPushToken = async () => {
	const token = storage.getString(PUSH_TOKEN_STORAGE_KEY);

	if (!token) {
		return;
	}

	await unregisterPushToken({ token });
	storage.remove(PUSH_TOKEN_STORAGE_KEY);
};
