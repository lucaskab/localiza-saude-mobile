import { useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar as CalendarIcon,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	createEmptyRecurrence,
	RecurrenceFields,
	type RecurrenceFormValue,
} from "@/components/appointments/recurrence-fields";
import { TimeSlotSelector } from "@/components/booking-screen";
import {
	buildCalendarState,
	buildCreateAppointmentPayload,
	formatUtcDateForApi,
	formatUtcDateForDisplay,
	parseCalendarDateAsUtc,
	providerAppointmentDefaultValues,
	providerAppointmentSchema,
	type ProviderAppointmentFormData,
} from "@/components/provider-appointments/form";
import { PatientSection } from "@/components/provider-appointments/patient-section";
import { ProceduresSection } from "@/components/provider-appointments/procedures-section";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { usePatientProfiles } from "@/hooks/use-patient-profiles";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import {
	useScheduleExceptionsByProvider,
	useSchedulesByProvider,
} from "@/hooks/use-schedules";
import { getErrorMessage } from "@/services/api";
import { showErrorMessageToast, showSuccessToast } from "@/services/toast";

export default function ProviderCreateAppointment() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { healthcareProvider } = useAuth();
	const providerId = healthcareProvider?.id || "";
	const [recurrence, setRecurrence] = useState<RecurrenceFormValue>(
		createEmptyRecurrence(formatUtcDateForApi(new Date()), ""),
	);

	const { control, handleSubmit, watch, setValue } =
		useForm<ProviderAppointmentFormData>({
			defaultValues: providerAppointmentDefaultValues,
		});

	const selectedDate = watch("selectedDate");
	const selectedTime = watch("selectedTime");
	const selectedProcedureIds = watch("selectedProcedureIds");
	const patientMode = watch("patientMode");
	const existingPatientProfileId = watch("existingPatientProfileId");
	const patientFullName = watch("patientFullName");

	const { data: proceduresData, isLoading: proceduresLoading } =
		useProceduresByProvider({
			healthcareProviderId: providerId,
			enabled: !!providerId,
		});
	const { data: schedulesData, isLoading: schedulesLoading } =
		useSchedulesByProvider(providerId, !!providerId);
	const { data: scheduleExceptionsData } = useScheduleExceptionsByProvider(
		providerId,
		!!providerId,
	);
	const { data: patientProfilesData, isLoading: patientProfilesLoading } =
		usePatientProfiles(!!providerId);
	const createAppointment = useCreateAppointment();

	const procedures = proceduresData?.procedures || [];
	const patientProfiles = patientProfilesData?.patientProfiles || [];
	const selectedProcedures = procedures.filter((procedure) =>
		selectedProcedureIds.includes(procedure.id),
	);
	const selectedPatientProfile = patientProfiles.find(
		(profile) => profile.id === existingPatientProfileId,
	);
	const activeSchedules =
		schedulesData?.schedules.filter((schedule) => schedule.isActive) || [];
	const formattedDate = formatUtcDateForApi(selectedDate);
	const todayDate = formatUtcDateForApi(new Date());
	const bookingAvailabilityDays =
		healthcareProvider?.bookingAvailabilityDays ?? 90;
	const activeScheduleExceptions =
		scheduleExceptionsData?.exceptions.filter((exception) => exception.isActive) ||
		[];
	const { markedDates, minDate, maxDate } = buildCalendarState({
		activeSchedules,
		bookingAvailabilityDays,
		scheduleExceptions: activeScheduleExceptions,
		selectedDate,
		selectedColor: theme.colors.primary,
	});

	useEffect(() => {
		setRecurrence((current) => ({
			...current,
			weeklySlots: current.weeklySlots.length
				? current.weeklySlots.map((slot, index) =>
						index === 0
							? {
									dayOfWeek: String(selectedDate.getUTCDay()),
									startTime: selectedTime,
								}
							: slot,
					)
				: current.weeklySlots,
		}));
	}, [selectedDate, selectedTime]);

	const toggleProcedure = (procedureId: string) => {
		const nextProcedureIds = selectedProcedureIds.includes(procedureId)
			? selectedProcedureIds.filter((id) => id !== procedureId)
			: [...selectedProcedureIds, procedureId];

		setValue("selectedProcedureIds", nextProcedureIds);
		setValue("selectedTime", "");
	};

	const onSubmit = async (values: ProviderAppointmentFormData) => {
		const parsed = providerAppointmentSchema.safeParse(values);

		if (!parsed.success) {
			Alert.alert(
				t("common.checkTheForm"),
				parsed.error.issues[0]?.message || t("common.pleaseReviewTheAppointment"),
			);
			return;
		}

		try {
			await createAppointment.mutateAsync(
				buildCreateAppointmentPayload({
					values: parsed.data,
					providerId,
					recurrence,
				}),
			);

			showSuccessToast("common.theAppointmentWasCreatedSuccessfully");
			router.replace("/(provider-tabs)/appointments");
		} catch (error) {
			showErrorMessageToast(getErrorMessage(error));
		}
	};

	const isLoading =
		proceduresLoading || schedulesLoading || patientProfilesLoading;
	const patientLabel =
		patientMode === "existing"
			? selectedPatientProfile?.fullName || t("common.savedPatient")
			: patientFullName.trim() || t("common.newPatient");

	if (!providerId) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<Text style={styles.emptyTitle}>{t("common.providerProfileRequired")}</Text>
					<Button onPress={() => router.back()}>{t("common.goBack")}</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			edges={["top"]}
			style={styles.container}
			testID="provider-create-appointment-screen"
		>
			<View style={styles.header}>
				<Pressable
					testID="provider-create-appointment-back-button"
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<ArrowLeft size={22} color={theme.colors.foreground} />
				</Pressable>
				<View style={styles.headerText}>
					<Text style={styles.headerTitle}>{t("common.newAppointment")}</Text>
					<Text style={styles.headerSubtitle}>{t("common.scheduleForYourOffice")}</Text>
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + theme.gap(4) },
				]}
			>
				{isLoading ? (
					<View style={styles.centerState}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.emptyText}>{t("common.loadingSchedule")}</Text>
					</View>
				) : (
					<>
						<PatientSection
							control={control}
							patientMode={patientMode}
							existingPatientProfileId={existingPatientProfileId}
							patientProfiles={patientProfiles}
							todayDate={todayDate}
							onSelectNewMode={() => setValue("patientMode", "new")}
							onSelectExistingMode={() => {
								setValue("patientMode", "existing");
								if (!existingPatientProfileId && patientProfiles[0]) {
									setValue(
										"existingPatientProfileId",
										patientProfiles[0].id,
									);
								}
							}}
							onSelectExistingProfile={(profileId) =>
								setValue("existingPatientProfileId", profileId)
							}
						/>

						<ProceduresSection
							procedures={procedures}
							selectedProcedureIds={selectedProcedureIds}
							onToggleProcedure={toggleProcedure}
						/>

						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<CalendarIcon
									size={20}
									color={theme.colors.primary}
									strokeWidth={2}
								/>
								<Text style={styles.sectionTitle}>{t("common.date")}</Text>
							</View>
							<Controller
								control={control}
								name="selectedDate"
								render={({ field: { onChange } }) => (
									<DatePickerInput
										value={formattedDate}
										placeholder="common.selectAppointmentDate"
										title="common.selectAppointmentDate"
										minDate={minDate}
										maxDate={maxDate}
										onChange={(dateString) => {
											onChange(parseCalendarDateAsUtc(dateString));
											setValue("selectedTime", "");
										}}
										markedDates={markedDates}
									/>
								)}
							/>
						</View>

						<TimeSlotSelector
							control={control}
							healthcareProviderId={providerId}
							selectedDate={selectedDate}
							selectedProcedures={selectedProcedures}
						/>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>
								{t("common.recurringAppointment")}
							</Text>
							<RecurrenceFields
								baseDate={formattedDate}
								baseTime={selectedTime}
								value={recurrence}
								onChange={setRecurrence}
							/>
						</View>

						<View style={styles.section}>
							<Text style={styles.sectionTitle}>{t("common.appointmentNotes2")}</Text>
							<Controller
								control={control}
								name="notes"
								render={({ field: { value, onChange } }) => (
									<Textarea
										placeholder={t("common.internalNotesOrReasonForVisit")}
										value={value}
										onChangeText={onChange}
									/>
								)}
							/>
						</View>

						<View style={styles.summaryCard}>
							<View>
								<Text style={styles.summaryLabel}>{t("common.readyToSchedule")}</Text>
								<Text style={styles.summaryText}>
									{patientLabel}
									{selectedTime
										? ` • ${formatUtcDateForDisplay(selectedDate)} ${t("common.at")} ${selectedTime}`
										: ""}
								</Text>
							</View>
							<Button
								onPress={handleSubmit(onSubmit)}
								loading={createAppointment.isPending}
								disabled={createAppointment.isPending}
								style={styles.submitButton}
							>
								{t("common.schedule")}
							</Button>
						</View>
					</>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
		marginRight: theme.gap(1),
	},
	headerText: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	headerSubtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	scrollContent: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	centerState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(4),
		gap: theme.gap(2),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	section: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	summaryCard: {
		backgroundColor: `${theme.colors.primary}14`,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: `${theme.colors.primary}33`,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	summaryLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.primary,
		textTransform: "uppercase",
	},
	summaryText: {
		fontSize: 15,
		color: theme.colors.foreground,
		marginTop: theme.gap(0.5),
	},
	submitButton: {
		borderRadius: theme.radius.full,
	},
}));
