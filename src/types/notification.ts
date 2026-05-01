export type NotificationType =
	| "APPOINTMENT_REMINDER"
	| "APPOINTMENT_STATUS_UPDATE"
	| "NEW_APPOINTMENT_REQUEST";

export type PushPlatform = "IOS" | "ANDROID" | "WEB" | "UNKNOWN";

export interface NotificationPreference {
	type: NotificationType;
	enabled: boolean;
}

export interface GetNotificationPreferencesResponse {
	preferences: NotificationPreference[];
}

export interface UpdateNotificationPreferencesData {
	preferences: NotificationPreference[];
}

export interface RegisterPushTokenData {
	token: string;
	platform: PushPlatform;
	deviceId?: string | null;
}

export interface RegisterPushTokenResponse {
	pushToken: {
		id: string;
		token: string;
		platform: PushPlatform;
		isActive: boolean;
	};
}

export interface UnregisterPushTokenData {
	token: string;
}

export interface UnregisterPushTokenResponse {
	success: boolean;
}
