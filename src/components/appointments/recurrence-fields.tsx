import { Plus, Repeat, Trash2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import type { AppointmentRecurrenceData } from "@/types/appointment";

export type RecurrenceSlotFormValue = {
	dayOfWeek: string;
	startTime: string;
};

export type RecurrenceFormValue = {
	enabled: boolean;
	isIndefinite: boolean;
	endsOn: string;
	weeklySlots: RecurrenceSlotFormValue[];
};

export function createEmptyRecurrence(baseDate: string, baseTime: string) {
	return {
		enabled: false,
		isIndefinite: false,
		endsOn: "",
		weeklySlots: [
			{
				dayOfWeek: String(getDayOfWeek(baseDate)),
				startTime: baseTime,
			},
		],
	} satisfies RecurrenceFormValue;
}

export function buildRecurrencePayload(
	value: RecurrenceFormValue,
): AppointmentRecurrenceData | undefined {
	if (!value.enabled) return undefined;

	const weeklySlots = value.weeklySlots.filter(
		(slot) => slot.dayOfWeek !== "" && slot.startTime,
	);

	if (weeklySlots.length === 0) {
		return undefined;
	}

	return {
		isIndefinite: value.isIndefinite,
		endsOn: value.isIndefinite ? null : value.endsOn || null,
		weeklySlots: weeklySlots.map((slot) => ({
			dayOfWeek: Number(slot.dayOfWeek),
			startTime: slot.startTime,
		})),
	};
}

export function RecurrenceFields({
	baseDate,
	baseTime,
	value,
	onChange,
}: {
	baseDate: string;
	baseTime: string;
	value: RecurrenceFormValue;
	onChange: (value: RecurrenceFormValue) => void;
}) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const weekDayOptions = [
		{ value: "0", label: t("common.sunday") },
		{ value: "1", label: t("common.monday") },
		{ value: "2", label: t("common.tuesday") },
		{ value: "3", label: t("common.wednesday") },
		{ value: "4", label: t("common.thursday") },
		{ value: "5", label: t("common.friday") },
		{ value: "6", label: t("common.saturday") },
	];

	function patch(nextValue: Partial<RecurrenceFormValue>) {
		onChange({
			...value,
			...nextValue,
		});
	}

	function patchSlot(index: number, nextValue: Partial<RecurrenceSlotFormValue>) {
		patch({
			weeklySlots: value.weeklySlots.map((slot, slotIndex) =>
				slotIndex === index
					? {
							...slot,
							...nextValue,
						}
					: slot,
			),
		});
	}

	function toggleEnabled() {
		const nextEnabled = !value.enabled;
		const nextWeeklySlots = [...value.weeklySlots];

		if (nextWeeklySlots.length === 0) {
			nextWeeklySlots.push({
				dayOfWeek: String(getDayOfWeek(baseDate)),
				startTime: baseTime,
			});
		} else {
			nextWeeklySlots[0] = {
				dayOfWeek: String(getDayOfWeek(baseDate)),
				startTime: baseTime,
			};
		}

		onChange({
			...value,
			enabled: nextEnabled,
			weeklySlots: nextWeeklySlots,
		});
	}

	function addWeeklySlot() {
		patch({
			weeklySlots: [
				...value.weeklySlots,
				{
					dayOfWeek: String(getDayOfWeek(baseDate)),
					startTime: baseTime,
				},
			],
		});
	}

	function removeWeeklySlot(index: number) {
		if (index === 0) return;

		patch({
			weeklySlots: value.weeklySlots.filter((_, slotIndex) => slotIndex !== index),
		});
	}

	return (
		<View style={styles.container}>
			<Pressable style={styles.toggleRow} onPress={toggleEnabled}>
				<View style={styles.toggleIconWrap}>
					<Repeat size={16} color={theme.colors.primary} strokeWidth={2} />
				</View>
				<View style={styles.toggleCopy}>
					<Text style={styles.title}>{t("common.recurringAppointment")}</Text>
					<Text style={styles.subtitle}>
						{t("common.reserveRecurringTimesForThisProvider")}
					</Text>
				</View>
				<View style={[styles.checkbox, value.enabled && styles.checkboxActive]} />
			</Pressable>

			{value.enabled ? (
				<View style={styles.section}>
					<Text style={styles.summary}>
						{t("common.firstOccurrence")}: {weekDayLabel(weekDayOptions, getDayOfWeek(baseDate))}{" "}
						{t("common.at")} {baseTime || "--:--"}
					</Text>

					{value.weeklySlots.map((slot, index) => (
						<View key={`${index}-${slot.dayOfWeek}-${slot.startTime}`} style={styles.slotRow}>
							<View style={styles.slotField}>
								<SelectInput
									value={slot.dayOfWeek}
									onChange={(nextValue) => patchSlot(index, { dayOfWeek: nextValue })}
									options={weekDayOptions}
									placeholder={t("common.dayOfWeek")}
								/>
							</View>
							<View style={styles.slotTimeField}>
								<Input
									value={slot.startTime}
									onChangeText={(nextValue) =>
										patchSlot(index, { startTime: nextValue })
									}
									placeholder="09:00"
								/>
							</View>
							<Pressable
								style={styles.removeButton}
								disabled={index === 0}
								onPress={() => removeWeeklySlot(index)}
							>
								<Trash2
									size={18}
									color={
										index === 0
											? theme.colors.mutedForeground
											: theme.colors.destructive
									}
									strokeWidth={2}
								/>
							</Pressable>
						</View>
					))}

					<Pressable style={styles.addButton} onPress={addWeeklySlot}>
						<Plus size={16} color={theme.colors.primary} strokeWidth={2} />
						<Text style={styles.addButtonText}>
							{t("common.addWeeklyTime")}
						</Text>
					</Pressable>

					<View style={styles.durationRow}>
						<View style={styles.durationField}>
							<SelectInput
								value={value.isIndefinite ? "INDEFINITE" : "FIXED"}
								onChange={(nextValue) =>
									patch({ isIndefinite: nextValue === "INDEFINITE" })
								}
								options={[
									{ value: "FIXED", label: t("common.untilAnEndDate") },
									{ value: "INDEFINITE", label: t("common.withoutEndDate") },
								]}
								placeholder={t("common.duration")}
							/>
						</View>
						{!value.isIndefinite ? (
							<View style={styles.durationField}>
								<DatePickerInput
									value={value.endsOn}
									minDate={baseDate}
									onChange={(nextValue) => patch({ endsOn: nextValue })}
								/>
							</View>
						) : null}
					</View>
				</View>
			) : null}
		</View>
	);
}

function getDayOfWeek(date: string) {
	if (!date) return new Date().getDay();

	return new Date(`${date}T00:00:00`).getDay();
}

function weekDayLabel(
	weekDayOptions: { value: string; label: string }[],
	dayOfWeek: number,
) {
	return weekDayOptions.find((option) => Number(option.value) === dayOfWeek)?.label || "Dia";
}

const styles = StyleSheet.create((theme) => ({
	container: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		gap: theme.gap(2),
		backgroundColor: theme.colors.surfacePrimary,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	toggleIconWrap: {
		width: 36,
		height: 36,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	toggleCopy: {
		flex: 1,
		gap: 2,
	},
	title: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	checkbox: {
		width: 18,
		height: 18,
		borderRadius: 999,
		borderWidth: 2,
		borderColor: theme.colors.border,
	},
	checkboxActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	section: {
		gap: theme.gap(2),
	},
	summary: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	slotRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	slotField: {
		flex: 1,
	},
	slotTimeField: {
		width: 112,
	},
	removeButton: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
	},
	addButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
	},
	addButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	durationRow: {
		gap: theme.gap(2),
	},
	durationField: {
		gap: theme.gap(1),
	},
}));
