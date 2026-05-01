import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import type { ProviderAppointmentTab } from "@/utils/provider-appointment-filters";

type AppointmentTabsProps = {
	activeTab: ProviderAppointmentTab;
	counts: Record<ProviderAppointmentTab, number>;
	onChange: (tab: ProviderAppointmentTab) => void;
};

const tabs: { label: TranslationKey; value: ProviderAppointmentTab }[] = [
	{ label: translationKeys.Upcoming, value: "upcoming" },
	{ label: translationKeys.Completed, value: "completed" },
	{ label: translationKeys.Cancelled, value: "cancelled" },
];

export function AppointmentTabs({
	activeTab,
	counts,
	onChange,
}: AppointmentTabsProps) {
	const { t } = useTranslation();

	return (
		<View style={styles.tabsContainer}>
			{tabs.map((tab) => {
				const active = activeTab === tab.value;

				return (
					<Pressable
						key={tab.value}
						style={[styles.tab, active && styles.tabActive]}
						onPress={() => onChange(tab.value)}
					>
						<Text style={[styles.tabText, active && styles.tabTextActive]}>
							{t(tab.label)}
						</Text>
						{counts[tab.value] > 0 ? (
							<View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
								<Text
									style={[
										styles.tabBadgeText,
										active && styles.tabBadgeTextActive,
									]}
								>
									{counts[tab.value]}
								</Text>
							</View>
						) : null}
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	tabsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
		marginBottom: theme.gap(3),
	},
	tab: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: 50,
		backgroundColor: theme.colors.surfacePrimary,
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(0.5),
	},
	tabActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	tabText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
	},
	tabTextActive: {
		color: theme.colors.primaryForeground,
	},
	tabBadge: {
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(0.5),
		borderRadius: 10,
		minWidth: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	tabBadgeActive: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
	},
	tabBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	tabBadgeTextActive: {
		color: theme.colors.primaryForeground,
	},
}));
