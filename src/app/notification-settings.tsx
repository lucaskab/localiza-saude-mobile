import { ArrowLeft, Bell, BellRing } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import type { TranslationKey } from "@/i18n";
import { getErrorMessage } from "@/services/api";
import {
	hasRegisteredPushToken,
	syncPushTokenWithBackend,
} from "@/services/push-notifications";
import type { NotificationPreference, NotificationType } from "@/types/notification";

const notificationOptions: {
	type: NotificationType;
	title: TranslationKey;
	description: TranslationKey;
}[] = [
	{
		type: "APPOINTMENT_REMINDER",
		title: "common.appointmentReminderNotification",
		description: "common.appointmentReminderNotificationDescription",
	},
	{
		type: "APPOINTMENT_STATUS_UPDATE",
		title: "common.appointmentStatusNotification",
		description: "common.appointmentStatusNotificationDescription",
	},
	{
		type: "NEW_APPOINTMENT_REQUEST",
		title: "common.newAppointmentRequestNotification",
		description: "common.newAppointmentRequestNotificationDescription",
	},
];

const buildPreferences = (
	preferences: NotificationPreference[],
	type: NotificationType,
	enabled: boolean,
) => {
	const preferenceMap = new Map(
		notificationOptions.map((option) => [option.type, true]),
	);

	for (const preference of preferences) {
		preferenceMap.set(preference.type, preference.enabled);
	}

	preferenceMap.set(type, enabled);

	return notificationOptions.map((option) => ({
		type: option.type,
		enabled: preferenceMap.get(option.type) ?? true,
	}));
};

export default function NotificationSettings() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const router = useRouter();
	const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);
	const [deviceTokenEnabled, setDeviceTokenEnabled] = useState(() =>
		hasRegisteredPushToken(),
	);

	const {
		data,
		isLoading,
		isError,
		refetch,
	} = useNotificationPreferences();
	const updatePreferences = useUpdateNotificationPreferences();

	const preferences = useMemo(() => data?.preferences ?? [], [data?.preferences]);

	const isPreferenceEnabled = (type: NotificationType) => {
		return preferences.find((preference) => preference.type === type)?.enabled ?? true;
	};

	const handleToggle = async (type: NotificationType, enabled: boolean) => {
		try {
			await updatePreferences.mutateAsync({
				preferences: buildPreferences(preferences, type, enabled),
			});
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		}
	};

	const handleEnableDevice = async () => {
		try {
			setIsRegisteringDevice(true);
			const token = await syncPushTokenWithBackend({
				force: true,
				requestPermission: true,
			});

			if (!token) {
				Alert.alert(
					t("common.notifications"),
					t("common.pushNotificationsUnavailableOnThisDevice"),
				);
				return;
			}

			setDeviceTokenEnabled(true);
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		} finally {
			setIsRegisteringDevice(false);
		}
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("common.goBack")}
						testID="notification-settings-back-button"
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<ArrowLeft
							size={20}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
					</Pressable>
					<View style={styles.headerIcon}>
						<Bell
							size={22}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
					</View>
					<View style={styles.headerCopy}>
						<Text style={styles.title}>{t("common.notifications")}</Text>
						<Text style={styles.subtitle}>
							{t("common.manageYourNotifications")}
						</Text>
					</View>
				</View>

				<View style={styles.deviceCard}>
					<View style={styles.deviceIcon}>
						<BellRing
							size={22}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
					</View>
					<View style={styles.deviceCopy}>
						<Text style={styles.deviceTitle}>
							{deviceTokenEnabled
								? t("common.pushNotificationsEnabledOnThisDevice")
								: t("common.enablePushNotificationsOnThisDevice")}
						</Text>
						<Text style={styles.deviceDescription}>
							{t("common.enablePushNotificationsDescription")}
						</Text>
					</View>
					<Button
						size="sm"
						variant="secondary"
						loading={isRegisteringDevice}
						disabled={isRegisteringDevice}
						testID="enable-push-notifications-button"
						onPress={handleEnableDevice}
						style={styles.deviceButton}
					>
						{t("common.enable")}
					</Button>
				</View>

				{isLoading ? (
					<View style={styles.stateCard}>
						<ActivityIndicator color={theme.colors.primary} />
						<Text style={styles.stateText}>
							{t("common.loadingNotificationPreferences")}
						</Text>
					</View>
				) : null}

				{isError ? (
					<View style={styles.stateCard}>
						<Text style={styles.stateText}>
							{t("common.failedToLoadNotificationPreferences")}
						</Text>
						<Button size="sm" variant="secondary" onPress={() => refetch()}>
							{t("common.retry")}
						</Button>
					</View>
				) : null}

				{!isLoading && !isError ? (
					<View style={styles.menuList}>
						{notificationOptions.map((option) => {
							const enabled = isPreferenceEnabled(option.type);

							return (
								<View
									key={option.type}
									testID={`notification-option-${option.type}`}
									style={styles.menuItem}
								>
									<View
										style={[
											styles.menuIconContainer,
											enabled && styles.menuIconContainerSelected,
										]}
									>
										<Bell
											size={20}
											color={
												enabled
													? theme.colors.primaryForeground
													: theme.colors.primary
											}
											strokeWidth={2}
										/>
									</View>
									<View style={styles.menuContent}>
										<Text style={styles.menuLabel}>{t(option.title)}</Text>
										<Text style={styles.menuDescription}>
											{t(option.description)}
										</Text>
									</View>
									<Switch
										value={enabled}
										disabled={updatePreferences.isPending}
										trackColor={{
											false: theme.colors.secondary,
											true: theme.colors.primary,
										}}
										thumbColor={theme.colors.primaryForeground}
										onValueChange={(value) => handleToggle(option.type, value)}
									/>
								</View>
							);
						})}
					</View>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	header: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	headerIcon: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	headerCopy: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	deviceCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	deviceIcon: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	deviceCopy: {
		flex: 1,
	},
	deviceTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	deviceDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	deviceButton: {
		minWidth: 92,
	},
	stateCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(3),
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	stateText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	menuList: {
		gap: theme.gap(1),
	},
	menuItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	menuIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	menuIconContainerSelected: {
		backgroundColor: theme.colors.primary,
	},
	menuContent: {
		flex: 1,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	menuDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
		lineHeight: 16,
	},
}));
