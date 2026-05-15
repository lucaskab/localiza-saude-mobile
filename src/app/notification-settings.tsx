import { Bell, BellRing } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { NotificationOptionCard } from "@/components/notification-settings/notification-option-card";
import {
	buildUpdatedNotificationPreferences,
	defaultNotificationPreference,
	notificationOptions,
} from "@/components/notification-settings/notification-options";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from "@/hooks/use-notifications";
import { getErrorMessage } from "@/services/api";
import {
	hasRegisteredPushToken,
	syncPushTokenWithBackend,
} from "@/services/push-notifications";
import type { NotificationType } from "@/types/notification";

export default function NotificationSettings() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
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

	const preferences = data?.preferences ?? [];

	const getPreference = (type: NotificationType) => {
		return (
			preferences.find((preference) => preference.type === type) ||
			defaultNotificationPreference(type)
		);
	};

	const handleToggle = async (
		type: NotificationType,
		channel: "pushEnabled" | "emailEnabled",
		enabled: boolean,
	) => {
		try {
			await updatePreferences.mutateAsync({
				preferences: buildUpdatedNotificationPreferences(
					preferences,
					type,
					channel,
					enabled,
				),
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
				<ScreenHeader
					title={t("common.notifications")}
					subtitle={t("common.manageYourNotifications")}
					icon={Bell}
					backButtonTestID="notification-settings-back-button"
				/>

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
							return (
								<NotificationOptionCard
									key={option.type}
									type={option.type}
									title={option.title}
									description={option.description}
									preference={getPreference(option.type)}
									disabled={updatePreferences.isPending}
									onToggle={handleToggle}
								/>
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
}));
