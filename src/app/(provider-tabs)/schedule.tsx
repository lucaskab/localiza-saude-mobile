import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CalendarClock, Clock, Plus, Save, Trash2 } from "lucide-react-native";
import {
	View,
	Text,
	ScrollView,
	Pressable,
	Switch,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useSchedulesByProvider,
	useCreateSchedule,
	useUpdateSchedule,
	useDeleteSchedule,
} from "@/hooks/use-schedules";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import type { Schedule } from "@/types/schedule";

// Zod schemas for types only (no runtime validation with zodResolver)
const timeSlotSchema = z.object({
	id: z.string().optional(),
	startTime: z.string(),
	endTime: z.string(),
	isActive: z.boolean(),
	_isNew: z.boolean().optional(),
	_isDeleted: z.boolean().optional(),
});

const dayScheduleSchema = z.object({
	enabled: z.boolean(),
	slots: z.array(timeSlotSchema),
});

// Use array-based schema instead of numbered keys
const scheduleFormSchema = z.object({
	days: z.array(dayScheduleSchema).length(7),
});

type ScheduleFormData = z.infer<typeof scheduleFormSchema>;
type TimeSlotData = z.infer<typeof timeSlotSchema>;
type DaySchedule = z.infer<typeof dayScheduleSchema>;

export default function ProviderSchedule() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const router = useRouter();
	const { healthcareProvider } = useAuth();
	const [isSaving, setIsSaving] = useState(false);

	// Fetch schedules
	const {
		data: schedulesData,
		isLoading,
		error,
		refetch,
	} = useSchedulesByProvider(
		healthcareProvider?.id || "",
		!!healthcareProvider?.id,
	);

	// Mutations
	const createMutation = useCreateSchedule();
	const updateMutation = useUpdateSchedule();
	const deleteMutation = useDeleteSchedule();

	const daysOfWeek: { dayOfWeek: number; label: TranslationKey }[] = [
		{ dayOfWeek: 1, label: translationKeys.Monday },
		{ dayOfWeek: 2, label: translationKeys.Tuesday },
		{ dayOfWeek: 3, label: translationKeys.Wednesday },
		{ dayOfWeek: 4, label: translationKeys.Thursday },
		{ dayOfWeek: 5, label: translationKeys.Friday },
		{ dayOfWeek: 6, label: translationKeys.Saturday },
		{ dayOfWeek: 0, label: translationKeys.Sunday },
	];

	// Transform backend data to form data
	const defaultValues = useMemo((): ScheduleFormData => {
		const emptyDay: DaySchedule = { enabled: false, slots: [] };
		// Initialize array with 7 empty days (indices 0-6 for Sunday-Saturday)
		const days: DaySchedule[] = Array(7)
			.fill(null)
			.map(() => ({ ...emptyDay, slots: [] }));

		if (!schedulesData?.schedules) {
			return { days };
		}

		schedulesData.schedules.forEach((schedule: Schedule) => {
			const dayIndex = schedule.dayOfWeek;

			if (schedule.isActive) {
				days[dayIndex].enabled = true;
			}

			days[dayIndex].slots.push({
				id: schedule.id,
				startTime: schedule.startTime,
				endTime: schedule.endTime,
				isActive: schedule.isActive,
			});
		});

		return { days };
	}, [schedulesData]);

	// Initialize form
	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<ScheduleFormData>({
		defaultValues,
	});

	// Reset form when data loads
	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	// Manual validation function
	const validateTimeFormat = (time: string): boolean => {
		const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
		return timeRegex.test(time);
	};

	const validateSlot = (slot: TimeSlotData): boolean => {
		if (slot._isDeleted) return true;
		return (
			validateTimeFormat(slot.startTime) && validateTimeFormat(slot.endTime)
		);
	};

	// Handle save
	const onSubmit = async (data: ScheduleFormData) => {
		if (!healthcareProvider?.id) return;

		// Manual validation
		for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
			const dayData = data.days[dayIndex];
			for (const slot of dayData.slots) {
				if (!validateSlot(slot)) {
					Alert.alert(t("common.invalidTime"), t("common.pleaseUseHHMmFormatEG0900"));
					return;
				}
			}
		}

		setIsSaving(true);

		try {
			const operations: Promise<unknown>[] = [];

			// Process each day
			for (let dayIndex = 0; dayIndex < data.days.length; dayIndex++) {
				const dayData = data.days[dayIndex];
				const originalDay = defaultValues.days[dayIndex];

				// Process slots
				for (const slot of dayData.slots) {
					if (slot._isDeleted && slot.id) {
						// Delete slot
						operations.push(deleteMutation.mutateAsync(slot.id));
					} else if (slot._isNew) {
						// Create new slot
						operations.push(
							createMutation.mutateAsync({
								healthcareProviderId: healthcareProvider.id,
								dayOfWeek: dayIndex,
								startTime: slot.startTime,
								endTime: slot.endTime,
							}),
						);
					} else if (slot.id) {
						// Check if slot was updated
						const originalSlot = originalDay.slots.find(
							(s) => s.id === slot.id,
						);
						const wasUpdated =
							!originalSlot ||
							originalSlot.startTime !== slot.startTime ||
							originalSlot.endTime !== slot.endTime ||
							originalSlot.isActive !== slot.isActive;

						if (wasUpdated) {
							operations.push(
								updateMutation.mutateAsync({
									scheduleId: slot.id,
									data: {
										startTime: slot.startTime,
										endTime: slot.endTime,
										isActive: dayData.enabled,
									},
								}),
							);
						}
					}
				}

				// Handle enabled/disabled state changes for existing slots
				if (dayData.enabled !== originalDay.enabled) {
					for (const slot of dayData.slots) {
						if (slot.id && !slot._isNew && !slot._isDeleted) {
							operations.push(
								updateMutation.mutateAsync({
									scheduleId: slot.id,
									data: { isActive: dayData.enabled },
								}),
							);
						}
					}
				}
			}

			// Execute all operations in batch
			await Promise.all(operations);

			// Refetch data and reset form
			await refetch();
			Alert.alert(t("common.success"), t("common.scheduleSavedSuccessfully"));
		} catch (error) {
			console.error("Failed to save schedule:", error);
			Alert.alert(t("common.error"), t("common.failedToSaveSchedulePleaseTryAgain"));
		} finally {
			setIsSaving(false);
		}
	};

	// Render day schedule
	const renderDaySchedule = (dayOfWeek: number, label: TranslationKey) => {
		return (
			<Controller
				key={dayOfWeek}
				control={control}
				name={`days.${dayOfWeek}`}
				render={({ field }) => {
					const value = field.value as DaySchedule;
					const onChange = field.onChange as (value: DaySchedule) => void;

					const toggleDay = () => {
						const newEnabled = !value.enabled;

						// If enabling and no slots, add default slot
						if (newEnabled && value.slots.length === 0) {
							onChange({
								enabled: newEnabled,
								slots: [
									{
										startTime: "09:00",
										endTime: "17:00",
										isActive: true,
										_isNew: true,
									},
								],
							});
						} else {
							// Update all slots' isActive status
							const updatedSlots = value.slots.map((slot) => ({
								...slot,
								isActive: newEnabled,
							}));
							onChange({
								enabled: newEnabled,
								slots: updatedSlots,
							});
						}
					};

					const addSlot = () => {
						const newSlot: TimeSlotData = {
							startTime: "09:00",
							endTime: "17:00",
							isActive: value.enabled,
							_isNew: true,
						};
						onChange({
							...value,
							slots: [...value.slots, newSlot],
						});
					};

					const removeSlot = (index: number) => {
						const slot = value.slots[index];
						if (slot.id) {
							// Mark as deleted instead of removing
							const updatedSlots = [...value.slots];
							updatedSlots[index] = { ...slot, _isDeleted: true };
							onChange({ ...value, slots: updatedSlots });
						} else {
							// Remove if it's a new slot
							const updatedSlots = value.slots.filter((_, i) => i !== index);
							onChange({ ...value, slots: updatedSlots });
						}
					};

					const updateSlotField = (
						index: number,
						field: "startTime" | "endTime",
						newValue: string,
					) => {
						const updatedSlots = [...value.slots];
						updatedSlots[index] = { ...updatedSlots[index], [field]: newValue };
						onChange({ ...value, slots: updatedSlots });
					};

					// Filter out deleted slots for display
					const visibleSlots = value.slots.filter((slot) => !slot._isDeleted);

					return (
						<View style={styles.dayCard}>
							<View style={styles.dayHeader}>
								<Text style={styles.dayLabel}>{t(label)}</Text>
								<Switch
									value={value.enabled}
									onValueChange={toggleDay}
									trackColor={{
										false: theme.colors.border,
										true: theme.colors.primary,
									}}
									thumbColor={theme.colors.background}
								/>
							</View>

							{value.enabled && (
								<View style={styles.slotsContainer}>
									{visibleSlots.length > 0 ? (
										visibleSlots.map((slot) => {
											const actualIndex = value.slots.findIndex(
												(s) => s === slot,
											);
											return (
												<View key={actualIndex} style={styles.slotRow}>
													<View style={styles.slotInputs}>
														<Input
															leftIcon={Clock}
															containerStyle={styles.timeInput}
															value={slot.startTime}
															onChangeText={(text) =>
																updateSlotField(actualIndex, "startTime", text)
															}
															placeholder="09:00"
															keyboardType="numbers-and-punctuation"
															maxLength={5}
														/>
														<Text style={styles.timeSeparator}>{t("common.to")}</Text>
														<Input
															containerStyle={styles.timeInput}
															value={slot.endTime}
															onChangeText={(text) =>
																updateSlotField(actualIndex, "endTime", text)
															}
															placeholder="17:00"
															keyboardType="numbers-and-punctuation"
															maxLength={5}
														/>
													</View>
													{visibleSlots.length > 1 && (
														<Pressable
															onPress={() => removeSlot(actualIndex)}
															style={styles.deleteButton}
														>
															<Trash2
																size={20}
																color={theme.colors.destructive}
																strokeWidth={2}
															/>
														</Pressable>
													)}
												</View>
											);
										})
									) : (
										<Text style={styles.emptySlots}>
											{t("common.noTimeSlotsAddOneBelow")}
										</Text>
									)}

									<Button
										variant="outline"
										size="sm"
										onPress={addSlot}
										style={styles.addSlotButton}
									>
										<View style={styles.addSlotContent}>
											<Plus
												size={16}
												color={theme.colors.foreground}
												strokeWidth={2}
											/>
											<Text style={styles.addSlotText}>{t("common.addTimeSlot")}</Text>
										</View>
									</Button>
								</View>
							)}

							{!value.enabled && (
								<Text style={styles.unavailableText}>{t("common.unavailable")}</Text>
							)}
						</View>
					);
				}}
			/>
		);
	};

	return (
		<SafeAreaView
			edges={["top"]}
			style={styles.container}
			testID="provider-schedule-screen"
		>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.editHeader}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("common.goBack")}
						testID="provider-schedule-back-button"
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
						<CalendarClock
							size={22}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
					</View>
					<View style={styles.editHeaderCopy}>
						<Text style={styles.editHeaderTitle}>{t("common.schedule")}</Text>
						<Text style={styles.editHeaderSubtitle}>
							{t("common.workingScheduleDescription")}
						</Text>
					</View>
				</View>

				<View style={styles.description}>
					<Text style={styles.descriptionText}>
						{t("common.setYourWorkingHoursForEachDayOfTheWeekPatientsWillOnlyBeAbleToBookAppointmentsDuringTheseTimes")}
					</Text>
				</View>

				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>{t("common.loadingSchedule")}</Text>
					</View>
				) : error ? (
					<View style={styles.errorContainer}>
						<AlertCircle
							size={48}
							color={theme.colors.destructive}
							strokeWidth={2}
						/>
						<Text style={styles.errorText}>{t("common.failedToLoadSchedule")}</Text>
						<Button onPress={() => refetch()} size="sm">
							{t("common.retry")}
						</Button>
					</View>
				) : (
					<View style={styles.scheduleList}>
						{daysOfWeek.map(({ dayOfWeek, label }) =>
							renderDaySchedule(dayOfWeek, label),
						)}
					</View>
				)}
			</ScrollView>

			{/* Sticky Save Button - Only shown when form is dirty */}
			{isDirty && !isLoading && (
				<View style={styles.stickyButtonContainer}>
					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={isSaving}
						loading={isSaving}
						style={styles.saveButton}
					>
						<View style={styles.saveButtonContent}>
							<Save size={20} color={theme.colors.primaryForeground} />
							<Text style={styles.saveButtonText}>{t("common.saveChanges")}</Text>
						</View>
					</Button>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(3),
		paddingBottom: theme.gap(20), // Extra padding for sticky button
	},
	editHeader: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		marginBottom: theme.gap(3),
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
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	editHeaderCopy: {
		flex: 1,
	},
	editHeaderTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	editHeaderSubtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	description: {
		marginBottom: theme.gap(3),
		backgroundColor: theme.colors.surfaceMuted,
		padding: theme.gap(2),
		borderRadius: theme.radius.lg,
	},
	descriptionText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
	},
	loadingContainer: {
		paddingVertical: theme.gap(8),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		paddingVertical: theme.gap(8),
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(2),
	},
	errorText: {
		fontSize: 16,
		color: theme.colors.destructive,
		textAlign: "center",
	},
	scheduleList: {
		gap: theme.gap(2),
	},
	dayCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2.5),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	dayHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(2),
	},
	dayLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	slotsContainer: {
		gap: theme.gap(2),
	},
	slotRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	slotInputs: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	timeInput: {
		flex: 1,
	},
	timeSeparator: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	deleteButton: {
		padding: theme.gap(1),
	},
	addSlotButton: {
		width: "100%",
		marginTop: theme.gap(1),
	},
	addSlotContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	addSlotText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	emptySlots: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		paddingVertical: theme.gap(1),
	},
	unavailableText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	stickyButtonContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.surfacePrimary,
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(2),
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 5,
	},
	saveButton: {
		width: "100%",
		borderRadius: theme.radius.full,
	},
	saveButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
}));
