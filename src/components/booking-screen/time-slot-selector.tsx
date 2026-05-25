import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Clock } from "lucide-react-native";
import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTimeSlots } from "@/hooks/use-appointments";

interface Procedure {
	id: string;
	name: string;
	durationInMinutes: number;
}

interface TimeSlotSelectorProps<TFieldValues extends FieldValues> {
	control: Control<TFieldValues>;
	healthcareProviderId: string;
	selectedDate: Date;
	selectedProcedures: Procedure[];
	name?: Path<TFieldValues>;
}

export function TimeSlotSelector<TFieldValues extends FieldValues>({
	control,
	healthcareProviderId,
	selectedDate,
	selectedProcedures,
	name = "selectedTime" as Path<TFieldValues>,
}: TimeSlotSelectorProps<TFieldValues>) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	const year = selectedDate.getUTCFullYear();
	const month = String(selectedDate.getUTCMonth() + 1).padStart(2, "0");
	const day = String(selectedDate.getUTCDate()).padStart(2, "0");
	const formattedDate = `${year}-${month}-${day}`;

	const procedureIds = selectedProcedures.map((procedure) => procedure.id);

	const {
		data: timeSlotsData,
		isLoading,
		error,
	} = useTimeSlots({
		healthcareProviderId,
		date: formattedDate,
		procedureIds,
		enabled: procedureIds.length > 0,
	});

	const availableSlots = timeSlotsData?.slots.filter((slot) => slot.available) ?? [];

	if (selectedProcedures.length === 0) {
		return (
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<Clock size={20} color={theme.colors.primary} strokeWidth={2} />
					<Text style={styles.sectionTitle}>{t("common.bookingAvailableSlotsTitle")}</Text>
				</View>
				<View style={styles.emptySlots}>
					<Text style={styles.emptyText}>
						{t("common.pleaseSelectAtLeastOneProcedureToSeeAvailableTimeSlots")}
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Clock size={20} color={theme.colors.primary} strokeWidth={2} />
				<Text style={styles.sectionTitle}>{t("common.bookingAvailableSlotsTitle")}</Text>
			</View>
			<Text style={styles.sectionSubtitle}>{t("common.bookingAvailableSlotsHint")}</Text>
			{timeSlotsData ? (
				<Text style={styles.sectionSubtitle}>
					{t("common.availableSlotsForDurationMinuteAppointmentIntervalMinIntervals", {
						duration: String(timeSlotsData.totalDurationMinutes),
						interval: String(timeSlotsData.slotIntervalMinutes),
					})}
				</Text>
			) : null}

			{isLoading && (
				<View style={styles.loadingSlots}>
					<ActivityIndicator size="small" color={theme.colors.primary} />
					<Text style={styles.loadingText}>{t("common.loadingAvailableSlots")}</Text>
				</View>
			)}

			{error && (
				<View style={styles.errorSlots}>
					<Text style={styles.errorText}>
						{t("common.failedToLoadAvailableTimeSlots")}
					</Text>
				</View>
			)}

			<Controller
				control={control}
				name={name}
				rules={{ required: t("common.pleaseSelectATime") }}
				render={({ field: { value, onChange }, fieldState }) => (
					<>
						{!isLoading && !error ? (
							availableSlots.length === 0 ? (
								<View style={styles.emptySlots}>
									<Text style={styles.emptyText}>{t("common.bookingNoAvailableSlots")}</Text>
								</View>
							) : (
								<View style={styles.timeSlots}>
									{availableSlots.map((slot) => (
										<Pressable
											key={slot.startTime}
											onPress={() => onChange(slot.startTime)}
											style={[
												styles.timeSlot,
												value === slot.startTime && styles.timeSlotSelected,
											]}
										>
											<Text
												style={[
													styles.timeSlotText,
													value === slot.startTime && styles.timeSlotTextSelected,
												]}
											>
												{slot.startTime}
											</Text>
										</Pressable>
									))}
								</View>
							)
						) : null}
						{fieldState.error?.message ? (
							<Text style={styles.validationErrorText}>
								{fieldState.error.message}
							</Text>
						) : null}
					</>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: {
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		marginBottom: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(1),
	},
	loadingSlots: {
		paddingVertical: theme.gap(4),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorSlots: {
		paddingVertical: theme.gap(4),
		alignItems: "center",
		justifyContent: "center",
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.destructive,
		textAlign: "center",
	},
	emptySlots: {
		paddingVertical: theme.gap(3),
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 20,
	},
	validationErrorText: {
		marginTop: theme.gap(2),
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.destructive,
	},
	timeSlots: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(0.75),
	},
	timeSlot: {
		paddingVertical: theme.gap(1.5),
		paddingHorizontal: theme.gap(0.5),
		borderRadius: theme.radius.lg,
		borderWidth: 2,
		borderColor: theme.colors.border,
		backgroundColor: "transparent",
		flexBasis: "24%",
		flexGrow: 0,
		flexShrink: 0,
		alignItems: "center",
		justifyContent: "center",
	},
	timeSlotSelected: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	timeSlotText: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	timeSlotTextSelected: {
		color: theme.colors.primaryForeground,
	},
}));
