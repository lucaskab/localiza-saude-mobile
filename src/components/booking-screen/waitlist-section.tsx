import { Bell, CheckCircle2, Clock } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import type { TimeSlot } from "@/types/appointment";

type WaitlistSectionProps = {
	formattedDate: string;
	waitlistSlots: TimeSlot[];
	joinedWaitlistSlots: string[];
	waitlistLoadingSlot?: string;
	onJoinWaitlist: (slotStartTime: string) => void;
};

export function WaitlistSection({
	formattedDate,
	waitlistSlots,
	joinedWaitlistSlots,
	waitlistLoadingSlot,
	onJoinWaitlist,
}: WaitlistSectionProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	if (waitlistSlots.length === 0) {
		return null;
	}

	return (
		<View style={styles.section}>
			<View style={styles.headerRow}>
				<View style={styles.iconWrap}>
					<Bell size={22} color={theme.colors.amber} strokeWidth={2} />
				</View>
				<View style={styles.headerText}>
					<Text style={styles.title}>{t("common.waitlistTitle")}</Text>
					<Text style={styles.description}>{t("common.waitlistDescription")}</Text>
					<Text style={styles.hint}>{t("common.waitlistHowItWorks")}</Text>
				</View>
			</View>

			<View style={styles.dateRow}>
				<Text style={styles.dateLabel}>{formattedDate}</Text>
				<Text style={styles.countBadge}>
					{t("common.waitlistSlotsCount", { count: waitlistSlots.length })}
				</Text>
			</View>

			<View style={styles.slotsList}>
				{waitlistSlots.map((slot) => {
					const isJoined = joinedWaitlistSlots.includes(slot.startTime);
					const isJoining = waitlistLoadingSlot === slot.startTime;

					return (
						<View key={slot.startTime} style={styles.slotCard}>
							<View style={styles.slotInfo}>
								<View style={styles.slotIcon}>
									<Clock size={18} color={theme.colors.mutedForeground} strokeWidth={2} />
								</View>
								<View style={styles.slotTextWrap}>
									<Text style={styles.slotTime}>{slot.startTime}</Text>
									<Text style={styles.slotMeta}>
										{t("common.waitlistOccupiedSlot")} · {formattedDate}
									</Text>
								</View>
							</View>

							{isJoined ? (
								<View style={styles.joinedBadge}>
									<CheckCircle2 size={18} color={theme.colors.primary} strokeWidth={2} />
									<Text style={styles.joinedText}>{t("common.onWaitlist")}</Text>
								</View>
							) : (
								<Button
									variant="outline"
									style={styles.joinButton}
									disabled={isJoining}
									onPress={() => onJoinWaitlist(slot.startTime)}
								>
									{isJoining ? (
										<ActivityIndicator size="small" color={theme.colors.primary} />
									) : (
										<Text style={styles.joinButtonText}>{t("common.joinWaitlist")}</Text>
									)}
								</Button>
							)}
						</View>
					);
				})}
			</View>

			{joinedWaitlistSlots.length > 0 ? (
				<View style={styles.confirmationBox}>
					{joinedWaitlistSlots
						.filter((slotTime) =>
							waitlistSlots.some((slot) => slot.startTime === slotTime),
						)
						.map((slotTime) => (
							<Text key={slotTime} style={styles.confirmationText}>
								{t("common.waitlistJoinedForSlot", { time: slotTime })}
							</Text>
						))}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: {
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		backgroundColor: `${theme.colors.amber}14`,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: `${theme.colors.amber}40`,
	},
	headerRow: {
		flexDirection: "row",
		gap: theme.gap(2),
	},
	iconWrap: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.lg,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: `${theme.colors.amber}22`,
	},
	headerText: {
		flex: 1,
		gap: theme.gap(0.75),
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	description: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
	},
	hint: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	dateRow: {
		marginTop: theme.gap(2.5),
		paddingTop: theme.gap(2),
		borderTopWidth: 1,
		borderTopColor: `${theme.colors.amber}30`,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	dateLabel: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	countBadge: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.foreground,
		backgroundColor: theme.colors.surfacePrimary,
		borderWidth: 1,
		borderColor: `${theme.colors.amber}35`,
		paddingHorizontal: theme.gap(1.25),
		paddingVertical: theme.gap(0.5),
		borderRadius: theme.radius.full,
		overflow: "hidden",
	},
	slotsList: {
		marginTop: theme.gap(2),
		gap: theme.gap(1.25),
	},
	slotCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		gap: theme.gap(1.5),
	},
	slotInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	slotIcon: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.muted,
	},
	slotTextWrap: {
		flex: 1,
	},
	slotTime: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	slotMeta: {
		marginTop: theme.gap(0.25),
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	joinedBadge: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(0.75),
	},
	joinedText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	joinButton: {
		borderColor: `${theme.colors.amber}55`,
	},
	joinButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	confirmationBox: {
		marginTop: theme.gap(2),
		padding: theme.gap(2),
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: `${theme.colors.primary}30`,
		backgroundColor: `${theme.colors.primary}10`,
		gap: theme.gap(0.75),
	},
	confirmationText: {
		fontSize: 13,
		color: theme.colors.foreground,
		lineHeight: 18,
	},
}));
