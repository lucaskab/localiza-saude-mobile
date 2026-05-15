import { Bell, Mail, Smartphone } from "lucide-react-native";
import { Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { TranslationKey } from "@/i18n";
import type { NotificationPreference, NotificationType } from "@/types/notification";

type NotificationOptionCardProps = {
	type: NotificationType;
	title: TranslationKey;
	description: TranslationKey;
	preference: NotificationPreference;
	disabled?: boolean;
	onToggle: (
		type: NotificationType,
		channel: "pushEnabled" | "emailEnabled",
		enabled: boolean,
	) => void;
};

export function NotificationOptionCard({
	type,
	title,
	description,
	preference,
	disabled,
	onToggle,
}: NotificationOptionCardProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const enabled = preference.pushEnabled || preference.emailEnabled;

	return (
		<View key={type} testID={`notification-option-${type}`} style={styles.menuItem}>
			<View
				style={[
					styles.menuIconContainer,
					enabled && styles.menuIconContainerSelected,
				]}
			>
				<Bell
					size={20}
					color={
						enabled ? theme.colors.primaryForeground : theme.colors.primary
					}
					strokeWidth={2}
				/>
			</View>
			<View style={styles.menuContent}>
				<Text style={styles.menuLabel}>{t(title)}</Text>
				<Text style={styles.menuDescription}>{t(description)}</Text>
			</View>
			<View style={styles.channelList}>
				<View style={styles.channelItem}>
					<View style={styles.channelLabelRow}>
						<Smartphone
							size={14}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
						<Text style={styles.channelLabel}>{t("common.push")}</Text>
					</View>
					<Switch
						value={preference.pushEnabled}
						disabled={disabled}
						trackColor={{
							false: theme.colors.secondary,
							true: theme.colors.primary,
						}}
						thumbColor={theme.colors.primaryForeground}
						onValueChange={(value) => onToggle(type, "pushEnabled", value)}
					/>
				</View>
				<View style={styles.channelItem}>
					<View style={styles.channelLabelRow}>
						<Mail size={14} color={theme.colors.primary} strokeWidth={2} />
						<Text style={styles.channelLabel}>{t("common.email")}</Text>
					</View>
					<Switch
						value={preference.emailEnabled}
						disabled={disabled}
						trackColor={{
							false: theme.colors.secondary,
							true: theme.colors.primary,
						}}
						thumbColor={theme.colors.primaryForeground}
						onValueChange={(value) => onToggle(type, "emailEnabled", value)}
					/>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
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
	channelList: {
		gap: theme.gap(1),
		minWidth: 132,
	},
	channelItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(1.5),
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1),
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
	},
	channelLabelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	channelLabel: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.foreground,
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
