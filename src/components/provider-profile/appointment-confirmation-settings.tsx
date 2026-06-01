import { BellRing } from "lucide-react-native";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	APPOINTMENT_CONFIRMATION_REMINDER_PRESETS,
} from "@/constants/appointment-notification-lead-hours";

type AppointmentConfirmationFormValues = {
	appointmentConfirmationReminderHoursBefore: string | null;
};

type AppointmentConfirmationSettingsProps<
	T extends FieldValues & AppointmentConfirmationFormValues = AppointmentConfirmationFormValues,
> = {
	control: Control<T>;
};

export function AppointmentConfirmationSettings<
	T extends FieldValues & AppointmentConfirmationFormValues = AppointmentConfirmationFormValues,
>({
	control,
}: AppointmentConfirmationSettingsProps<T>) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<View style={styles.card}>
			<View style={styles.headerRow}>
				<View style={styles.iconWrap}>
					<BellRing size={18} color={theme.colors.primary} />
				</View>
				<View style={styles.headerText}>
					<Text style={styles.title}>
						{t("common.appointmentConfirmationSettingsTitle")}
					</Text>
					<Text style={styles.description}>
						{t("common.appointmentConfirmationSettingsDescription")}
					</Text>
				</View>
			</View>

			<Controller
				control={control}
				name={"appointmentConfirmationReminderHoursBefore" as Path<T>}
				render={({ field: { value, onChange } }) => (
					<View style={styles.presetRow}>
						{APPOINTMENT_CONFIRMATION_REMINDER_PRESETS.map((hours) => {
							const isActive = String(value) === String(hours);

							return (
								<Pressable
									key={hours}
									style={[
										styles.presetChip,
										isActive && styles.presetChipActive,
									]}
									onPress={() => onChange(String(hours))}
								>
									<Text
										style={[
											styles.presetChipText,
											isActive && styles.presetChipTextActive,
										]}
									>
										{t("common.appointmentConfirmationPresetHours", {
											defaultValue: "{{hours}}h before",
											hours,
										})}
									</Text>
								</Pressable>
							);
						})}
					</View>
				)}
			/>

			<Controller
				control={control}
				name={"appointmentConfirmationReminderHoursBefore" as Path<T>}
				render={({ field, fieldState }) => (
					<FieldGroup label={t("common.appointmentConfirmationHoursBeforeLabel")}>
						<Input
							leftIcon={BellRing}
							value={field.value || ""}
							onChangeText={field.onChange}
							placeholder="24"
							keyboardType="numeric"
							errorMessage={fieldState.error?.message}
						/>
					</FieldGroup>
				)}
			/>
			<Text style={styles.hint}>{t("common.appointmentConfirmationHoursBeforeHint")}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.primary + "12",
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.primary + "33",
		gap: theme.gap(2),
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(2),
	},
	iconWrap: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary + "18",
	},
	headerText: {
		flex: 1,
		gap: theme.gap(0.75),
	},
	title: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	description: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	presetRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	presetChip: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.full,
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1),
		backgroundColor: theme.colors.surfacePrimary,
	},
	presetChipActive: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primary,
	},
	presetChipText: {
		fontSize: 13,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	presetChipTextActive: {
		color: theme.colors.primaryForeground,
	},
	hint: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 17,
	},
}));
