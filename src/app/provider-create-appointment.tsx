import { useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar as CalendarIcon,
	HeartPulse,
	Mail,
	Phone,
	Plus,
	ShieldPlus,
	User,
	Users,
} from "lucide-react-native";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";
import { TimeSlotSelector } from "@/components/booking-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { usePatientProfiles } from "@/hooks/use-patient-profiles";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import { useSchedulesByProvider } from "@/hooks/use-schedules";
import { getErrorMessage } from "@/services/api";

const optionalTextSchema = z.string().transform((value) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
});

const optionalDateSchema = z.string().transform((value, context) => {
	const trimmed = value.trim();

	if (!trimmed) {
		return null;
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		context.addIssue({
			code: "custom",
			message: "Use YYYY-MM-DD for date of birth",
		});
		return z.NEVER;
	}

	return trimmed;
});

const providerAppointmentSchema = z
	.object({
		selectedDate: z.date(),
		selectedTime: z.string().min(1, "Choose an available time"),
		selectedProcedureIds: z.array(z.string()).min(1, "Choose a procedure"),
		patientMode: z.enum(["existing", "new"]),
		existingPatientProfileId: z.string(),
		patientFullName: z.string(),
		patientDateOfBirth: optionalDateSchema,
		patientCpf: optionalTextSchema,
		patientPhone: optionalTextSchema,
		patientEmail: optionalTextSchema,
		patientGender: optionalTextSchema,
		patientNotes: optionalTextSchema,
		patientBloodType: optionalTextSchema,
		patientMedications: optionalTextSchema,
		patientAllergies: optionalTextSchema,
		patientChronicPain: optionalTextSchema,
		patientPreExistingConditions: optionalTextSchema,
		patientEmergencyContactName: optionalTextSchema,
		patientEmergencyContactPhone: optionalTextSchema,
		notes: optionalTextSchema,
	})
	.superRefine((value, context) => {
		if (value.patientMode === "existing" && !value.existingPatientProfileId) {
			context.addIssue({
				code: "custom",
				path: ["existingPatientProfileId"],
				message: "Choose a patient profile",
			});
		}

		if (value.patientMode === "new" && !value.patientFullName.trim()) {
			context.addIssue({
				code: "custom",
				path: ["patientFullName"],
				message: "Patient name is required",
			});
		}
	});

type ProviderAppointmentFormData = z.input<typeof providerAppointmentSchema>;

const formatUtcDateForApi = (date: Date) => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

const parseCalendarDateAsUtc = (dateString: string) => {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
};

const formatUtcDateForDisplay = (date: Date) =>
	date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});

export default function ProviderCreateAppointment() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { theme } = useUnistyles();
	const { healthcareProvider } = useAuth();
	const providerId = healthcareProvider?.id || "";

	const { control, handleSubmit, watch, setValue } =
		useForm<ProviderAppointmentFormData>({
			defaultValues: {
				selectedDate: parseCalendarDateAsUtc(formatUtcDateForApi(new Date())),
				selectedTime: "",
				selectedProcedureIds: [],
				patientMode: "new",
				existingPatientProfileId: "",
				patientFullName: "",
				patientDateOfBirth: "",
				patientCpf: "",
				patientPhone: "",
				patientEmail: "",
				patientGender: "",
				patientNotes: "",
				patientBloodType: "",
				patientMedications: "",
				patientAllergies: "",
				patientChronicPain: "",
				patientPreExistingConditions: "",
				patientEmergencyContactName: "",
				patientEmergencyContactPhone: "",
				notes: "",
			},
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
	const formattedDate = useMemo(
		() => formatUtcDateForApi(selectedDate),
		[selectedDate],
	);

	const { markedDates, minDate, maxDate } = useMemo(() => {
		const today = parseCalendarDateAsUtc(formatUtcDateForApi(new Date()));
		const max = new Date();
		max.setMonth(max.getMonth() + 3);
		const availableDaysOfWeek = new Set(
			activeSchedules.map((schedule) => schedule.dayOfWeek),
		);
		const marked: Record<
			string,
			{
				selected?: boolean;
				selectedColor?: string;
				disabled?: boolean;
				disableTouchEvent?: boolean;
			}
		> = {};

		if (selectedDate) {
			marked[formatUtcDateForApi(selectedDate)] = {
				selected: true,
				selectedColor: theme.colors.primary,
			};
		}

		for (let i = 0; i < 90; i++) {
			const date = new Date(today);
			date.setUTCDate(date.getUTCDate() + i);
			const dayOfWeek = date.getUTCDay();
			const dateStr = formatUtcDateForApi(date);

			if (!availableDaysOfWeek.has(dayOfWeek)) {
				marked[dateStr] = {
					...marked[dateStr],
					disabled: true,
					disableTouchEvent: true,
				};
			}
		}

		return {
			markedDates: marked,
			minDate: formatUtcDateForApi(today),
			maxDate: formatUtcDateForApi(max),
		};
	}, [activeSchedules, selectedDate, theme.colors.primary]);

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
				"Check the form",
				parsed.error.issues[0]?.message || "Please review the appointment.",
			);
			return;
		}

		try {
			const formData = parsed.data;
			const [time, period] = formData.selectedTime.split(" ");
			const [hours, minutes] = time.split(":").map(Number);
			const hour24 =
				period === "PM" && hours !== 12
					? hours + 12
					: period === "AM" && hours === 12
						? 0
						: hours;
			const appointmentDate = new Date(formData.selectedDate);
			appointmentDate.setUTCHours(hour24, minutes, 0, 0);

			const patient =
				formData.patientMode === "existing"
					? ({
							type: "EXISTING_PROFILE",
							patientProfileId: formData.existingPatientProfileId,
						} as const)
					: ({
							type: "NEW_PROFILE",
							profile: {
								fullName: formData.patientFullName.trim(),
								dateOfBirth: formData.patientDateOfBirth,
								cpf: formData.patientCpf,
								phone: formData.patientPhone,
								email: formData.patientEmail,
								gender: formData.patientGender,
								notes: formData.patientNotes,
								bloodType: formData.patientBloodType,
								medications: formData.patientMedications,
								allergies: formData.patientAllergies,
								chronicPain: formData.patientChronicPain,
								preExistingConditions:
									formData.patientPreExistingConditions,
								emergencyContactName: formData.patientEmergencyContactName,
								emergencyContactPhone:
									formData.patientEmergencyContactPhone,
							},
						} as const);

			await createAppointment.mutateAsync({
				healthcareProviderId: providerId,
				scheduledAt: appointmentDate.toISOString(),
				procedureIds: formData.selectedProcedureIds,
				notes: formData.notes,
				patient,
			});

			Alert.alert("Scheduled", "The appointment was created successfully.", [
				{
					text: "OK",
					onPress: () => router.replace("/(provider-tabs)/appointments"),
				},
			]);
		} catch (error) {
			Alert.alert("Error", getErrorMessage(error));
		}
	};

	const isLoading =
		proceduresLoading || schedulesLoading || patientProfilesLoading;
	const patientLabel =
		patientMode === "existing"
			? selectedPatientProfile?.fullName || "Saved patient"
			: patientFullName.trim() || "New patient";

	if (!providerId) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<Text style={styles.emptyTitle}>Provider profile required</Text>
					<Button onPress={() => router.back()}>Go Back</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<ArrowLeft size={22} color={theme.colors.foreground} />
				</Pressable>
				<View style={styles.headerText}>
					<Text style={styles.headerTitle}>New Appointment</Text>
					<Text style={styles.headerSubtitle}>Schedule for your office</Text>
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
						<Text style={styles.emptyText}>Loading schedule...</Text>
					</View>
				) : (
					<>
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Users
									size={20}
									color={theme.colors.primary}
									strokeWidth={2}
								/>
								<Text style={styles.sectionTitle}>Patient</Text>
							</View>

							<View style={styles.modeGrid}>
								<Pressable
									style={[
										styles.modeButton,
										patientMode === "new" && styles.modeButtonActive,
									]}
									onPress={() => setValue("patientMode", "new")}
								>
									<Plus
										size={18}
										color={
											patientMode === "new"
												? theme.colors.primaryForeground
												: theme.colors.foreground
										}
									/>
									<Text
										style={[
											styles.modeButtonText,
											patientMode === "new" &&
												styles.modeButtonTextActive,
										]}
									>
										New
									</Text>
								</Pressable>
								<Pressable
									style={[
										styles.modeButton,
										patientMode === "existing" && styles.modeButtonActive,
									]}
									onPress={() => {
										setValue("patientMode", "existing");
										if (!existingPatientProfileId && patientProfiles[0]) {
											setValue(
												"existingPatientProfileId",
												patientProfiles[0].id,
											);
										}
									}}
								>
									<Users
										size={18}
										color={
											patientMode === "existing"
												? theme.colors.primaryForeground
												: theme.colors.foreground
										}
									/>
									<Text
										style={[
											styles.modeButtonText,
											patientMode === "existing" &&
												styles.modeButtonTextActive,
										]}
									>
										Saved
									</Text>
								</Pressable>
							</View>

							{patientMode === "existing" ? (
								<View style={styles.patientProfilesList}>
									{patientProfiles.length === 0 ? (
										<Text style={styles.emptyText}>
											No saved patient profiles yet.
										</Text>
									) : (
										patientProfiles.map((profile) => {
											const selected =
												profile.id === existingPatientProfileId;

											return (
												<Pressable
													key={profile.id}
													style={[
														styles.patientProfileOption,
														selected &&
															styles.patientProfileOptionActive,
													]}
													onPress={() =>
														setValue(
															"existingPatientProfileId",
															profile.id,
														)
													}
												>
													<View style={styles.patientProfileInitial}>
														<Text style={styles.patientProfileInitialText}>
															{profile.fullName.charAt(0).toUpperCase()}
														</Text>
													</View>
													<View style={styles.patientProfileInfo}>
														<Text style={styles.patientProfileName}>
															{profile.fullName}
														</Text>
														<Text style={styles.patientProfileMeta}>
															{[profile.phone, profile.email]
																.filter(Boolean)
																.join(" • ") || "Patient profile"}
														</Text>
													</View>
												</Pressable>
											);
										})
									)}
								</View>
							) : null}

							{patientMode === "new" ? (
								<View style={styles.patientForm}>
									<Controller
										control={control}
										name="patientFullName"
										render={({ field: { value, onChange } }) => (
											<Input
												leftIcon={User}
												placeholder="Full name"
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
									<View style={styles.fieldRow}>
										<Controller
											control={control}
											name="patientDateOfBirth"
											render={({ field: { value, onChange } }) => (
												<Input
													placeholder="Birth date"
													value={value}
													onChangeText={onChange}
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
										<Controller
											control={control}
											name="patientGender"
											render={({ field: { value, onChange } }) => (
												<Input
													placeholder="Gender"
													value={value}
													onChangeText={onChange}
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
									</View>
									<View style={styles.fieldRow}>
										<Controller
											control={control}
											name="patientPhone"
											render={({ field: { value, onChange } }) => (
												<Input
													leftIcon={Phone}
													placeholder="Phone"
													value={value}
													onChangeText={onChange}
													keyboardType="phone-pad"
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
										<Controller
											control={control}
											name="patientEmail"
											render={({ field: { value, onChange } }) => (
												<Input
													leftIcon={Mail}
													placeholder="Email"
													value={value}
													onChangeText={onChange}
													autoCapitalize="none"
													keyboardType="email-address"
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
									</View>
									<Controller
										control={control}
										name="patientCpf"
										render={({ field: { value, onChange } }) => (
											<Input
												placeholder="CPF"
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
									<Text style={styles.fieldGroupTitle}>Health context</Text>
									<View style={styles.fieldRow}>
										<Controller
											control={control}
											name="patientBloodType"
											render={({ field: { value, onChange } }) => (
												<Input
													leftIcon={ShieldPlus}
													placeholder="Blood type"
													value={value}
													onChangeText={onChange}
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
										<Controller
											control={control}
											name="patientMedications"
											render={({ field: { value, onChange } }) => (
												<Input
													placeholder="Medications"
													value={value}
													onChangeText={onChange}
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
									</View>
									<Controller
										control={control}
										name="patientAllergies"
										render={({ field: { value, onChange } }) => (
											<Input
												leftIcon={HeartPulse}
												placeholder="Allergies"
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
									<Controller
										control={control}
										name="patientChronicPain"
										render={({ field: { value, onChange } }) => (
											<Input
												leftIcon={HeartPulse}
												placeholder="Chronic pain"
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
									<Controller
										control={control}
										name="patientPreExistingConditions"
										render={({ field: { value, onChange } }) => (
											<Textarea
												placeholder="Pre-existing conditions, surgeries, family history..."
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
									<View style={styles.fieldRow}>
										<Controller
											control={control}
											name="patientEmergencyContactName"
											render={({ field: { value, onChange } }) => (
												<Input
													placeholder="Emergency contact"
													value={value}
													onChangeText={onChange}
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
										<Controller
											control={control}
											name="patientEmergencyContactPhone"
											render={({ field: { value, onChange } }) => (
												<Input
													placeholder="Emergency phone"
													value={value}
													onChangeText={onChange}
													keyboardType="phone-pad"
													containerStyle={styles.fieldHalf}
												/>
											)}
										/>
									</View>
									<Controller
										control={control}
										name="patientNotes"
										render={({ field: { value, onChange } }) => (
											<Textarea
												placeholder="Additional patient notes"
												value={value}
												onChangeText={onChange}
											/>
										)}
									/>
								</View>
							) : null}
						</View>

						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<ShieldPlus
									size={20}
									color={theme.colors.primary}
									strokeWidth={2}
								/>
								<Text style={styles.sectionTitle}>Procedures</Text>
							</View>
							<View style={styles.procedureGrid}>
								{procedures.map((procedure) => {
									const selected = selectedProcedureIds.includes(
										procedure.id,
									);

									return (
										<Pressable
											key={procedure.id}
											style={[
												styles.procedureOption,
												selected && styles.procedureOptionActive,
											]}
											onPress={() => toggleProcedure(procedure.id)}
										>
											<Text
												style={[
													styles.procedureName,
													selected && styles.procedureNameActive,
												]}
											>
												{procedure.name}
											</Text>
											<Text
												style={[
													styles.procedureMeta,
													selected && styles.procedureMetaActive,
												]}
											>
												{procedure.durationInMinutes} min • $
												{(procedure.priceInCents / 100).toFixed(2)}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</View>

						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<CalendarIcon
									size={20}
									color={theme.colors.primary}
									strokeWidth={2}
								/>
								<Text style={styles.sectionTitle}>Date</Text>
							</View>
							<Controller
								control={control}
								name="selectedDate"
								render={({ field: { onChange } }) => (
									<Calendar
										current={formattedDate}
										minDate={minDate}
										maxDate={maxDate}
										onDayPress={(day) => {
											onChange(parseCalendarDateAsUtc(day.dateString));
											setValue("selectedTime", "");
										}}
										markedDates={markedDates}
										theme={{
											backgroundColor: theme.colors.background,
											calendarBackground: theme.colors.surfacePrimary,
											textSectionTitleColor:
												theme.colors.mutedForeground,
											selectedDayBackgroundColor: theme.colors.primary,
											selectedDayTextColor:
												theme.colors.primaryForeground,
											todayTextColor: theme.colors.primary,
											dayTextColor: theme.colors.foreground,
											textDisabledColor:
												theme.colors.mutedForeground,
											arrowColor: theme.colors.primary,
											monthTextColor: theme.colors.foreground,
										}}
										style={styles.calendar}
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
							<Text style={styles.sectionTitle}>Appointment notes</Text>
							<Controller
								control={control}
								name="notes"
								render={({ field: { value, onChange } }) => (
									<Textarea
										placeholder="Internal notes or reason for visit"
										value={value}
										onChangeText={onChange}
									/>
								)}
							/>
						</View>

						<View style={styles.summaryCard}>
							<View>
								<Text style={styles.summaryLabel}>Ready to schedule</Text>
								<Text style={styles.summaryText}>
									{patientLabel}
									{selectedTime
										? ` • ${formatUtcDateForDisplay(selectedDate)} at ${selectedTime}`
										: ""}
								</Text>
							</View>
							<Button
								onPress={handleSubmit(onSubmit)}
								loading={createAppointment.isPending}
								disabled={createAppointment.isPending}
								style={styles.submitButton}
							>
								Schedule
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
	modeGrid: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	modeButton: {
		flex: 1,
		minHeight: 48,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(0.5),
	},
	modeButtonActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	modeButtonText: {
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	modeButtonTextActive: {
		color: theme.colors.primaryForeground,
	},
	patientProfilesList: {
		gap: theme.gap(1.5),
	},
	patientProfileOption: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		padding: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	patientProfileOptionActive: {
		borderColor: theme.colors.primary,
		backgroundColor: `${theme.colors.primary}12`,
	},
	patientProfileInitial: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	patientProfileInitialText: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	patientProfileInfo: {
		flex: 1,
	},
	patientProfileName: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	patientProfileMeta: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	patientForm: {
		gap: theme.gap(1.5),
	},
	fieldRow: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	fieldHalf: {
		flex: 1,
	},
	fieldGroupTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
		textTransform: "uppercase",
		marginTop: theme.gap(1),
	},
	procedureGrid: {
		gap: theme.gap(1),
	},
	procedureOption: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
	},
	procedureOptionActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	procedureName: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	procedureNameActive: {
		color: theme.colors.primaryForeground,
	},
	procedureMeta: {
		marginTop: theme.gap(0.5),
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	procedureMetaActive: {
		color: theme.colors.primaryForeground,
	},
	calendar: {
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		overflow: "hidden",
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
