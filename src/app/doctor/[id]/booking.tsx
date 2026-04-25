import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar as CalendarIcon,
	Clock,
	HeartPulse,
	Mail,
	Phone,
	ShieldPlus,
	User,
	UserPlus,
	Users,
} from "lucide-react-native";
import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	Text,
	View,
	Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Calendar } from "react-native-calendars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useHealthcareProvider } from "@/hooks/use-healthcare-providers";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { usePatientProfiles } from "@/hooks/use-patient-profiles";
import { useSchedulesByProvider } from "@/hooks/use-schedules";
import { TimeSlotSelector } from "@/components/booking-screen";
import { getErrorMessage } from "@/services/api";
import { z } from "zod";

const bookingModeSchema = z.enum(["self", "existing", "new"]);
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

const bookingFormSchema = z
	.object({
		selectedDate: z.date(),
		selectedTime: z.string().min(1),
		notes: optionalTextSchema,
		bookingFor: bookingModeSchema,
		existingPatientProfileId: z.string(),
		patientFullName: z.string(),
		patientDateOfBirth: optionalDateSchema,
		patientCpf: optionalTextSchema,
		patientPhone: optionalTextSchema,
		patientEmail: optionalTextSchema,
		patientGender: optionalTextSchema,
		patientRelationship: optionalTextSchema,
		patientNotes: optionalTextSchema,
		patientBloodType: optionalTextSchema,
		patientMedications: optionalTextSchema,
		patientAllergies: optionalTextSchema,
		patientChronicPain: optionalTextSchema,
		patientPreExistingConditions: optionalTextSchema,
		patientEmergencyContactName: optionalTextSchema,
		patientEmergencyContactPhone: optionalTextSchema,
	})
	.superRefine((value, context) => {
		if (value.bookingFor === "existing" && !value.existingPatientProfileId) {
			context.addIssue({
				code: "custom",
				path: ["existingPatientProfileId"],
				message: "Choose a patient profile",
			});
		}

		if (value.bookingFor === "new" && !value.patientFullName.trim()) {
			context.addIssue({
				code: "custom",
				path: ["patientFullName"],
				message: "Patient name is required",
			});
		}
	});

type BookingFormData = z.input<typeof bookingFormSchema>;

const emptyPatientFields = {
	bookingFor: "self",
	existingPatientProfileId: "",
	patientFullName: "",
	patientDateOfBirth: "",
	patientCpf: "",
	patientPhone: "",
	patientEmail: "",
	patientGender: "",
	patientRelationship: "",
	patientNotes: "",
	patientBloodType: "",
	patientMedications: "",
	patientAllergies: "",
	patientChronicPain: "",
	patientPreExistingConditions: "",
	patientEmergencyContactName: "",
	patientEmergencyContactPhone: "",
} satisfies Omit<BookingFormData, "selectedDate" | "selectedTime" | "notes">;

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
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});

export default function Booking() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();

	// Setup React Hook Form
	const { control, handleSubmit, watch, setValue } = useForm<BookingFormData>({
		defaultValues: {
			selectedDate: parseCalendarDateAsUtc(formatUtcDateForApi(new Date())),
			selectedTime: "",
			notes: "",
			...emptyPatientFields,
		},
	});

	const selectedDate = watch("selectedDate");
	const selectedTime = watch("selectedTime");
	const bookingFor = watch("bookingFor");
	const selectedPatientProfileId = watch("existingPatientProfileId");
	const newPatientName = watch("patientFullName");

	// Fetch provider data
	const {
		data: providerData,
		isLoading: providerLoading,
		error: providerError,
	} = useHealthcareProvider(id);

	// Get selected procedures from URL
	const proceduresParam = useLocalSearchParams<{ procedures?: string }>()
		.procedures;
	const procedureIds = proceduresParam?.split(",") || [];

	// Fetch procedures
	const { data: proceduresData, isLoading: proceduresLoading } =
		useProceduresByProvider({
			healthcareProviderId: id,
		});

	// Fetch provider schedules
	const { data: schedulesData, isLoading: schedulesLoading } =
		useSchedulesByProvider(id, !!id);
	const { data: patientProfilesData, isLoading: patientProfilesLoading } =
		usePatientProfiles();

	// Format date for API (YYYY-MM-DD)
	const formattedDate = useMemo(() => {
		return formatUtcDateForApi(selectedDate);
	}, [selectedDate]);

	// Create appointment mutation
	const createAppointment = useCreateAppointment();

	const isLoading =
		providerLoading ||
		proceduresLoading ||
		schedulesLoading ||
		patientProfilesLoading;

	const provider = providerData?.healthcareProvider;
	const procedures = proceduresData?.procedures || [];
	const selectedProcedures = procedures.filter((p) =>
		procedureIds.includes(p.id),
	);
	const patientProfiles = patientProfilesData?.patientProfiles || [];
	const selectedPatientProfile = patientProfiles.find(
		(profile) => profile.id === selectedPatientProfileId,
	);
	const appointmentPatientLabel =
		bookingFor === "self"
			? "You"
			: bookingFor === "existing"
				? selectedPatientProfile?.fullName || "Selected patient"
				: newPatientName.trim() || "New patient";

	// Calculate totals
	const totalDuration = selectedProcedures.reduce(
		(sum, p) => sum + p.durationInMinutes,
		0,
	);
	const totalPrice = selectedProcedures.reduce(
		(sum, p) => sum + p.priceInCents / 100,
		0,
	);

	// Get active schedules
	const activeSchedules =
		schedulesData?.schedules.filter((s) => s.isActive) || [];

		// Calculate disabled dates and marked dates for calendar
	const { markedDates, minDate, maxDate } = useMemo(() => {
		const today = parseCalendarDateAsUtc(formatUtcDateForApi(new Date()));

		// Max date is 3 months from now
		const max = new Date();
		max.setMonth(max.getMonth() + 3);

		const marked: {
			[key: string]: {
				selected?: boolean;
				selectedColor?: string;
				disabled?: boolean;
				disableTouchEvent?: boolean;
			};
		} = {};

		// Get which days of week are available
		const availableDaysOfWeek = new Set(
			activeSchedules.map((s) => s.dayOfWeek),
		);

		// Mark selected date
		if (selectedDate) {
			const dateStr = formatUtcDateForApi(selectedDate);
			marked[dateStr] = {
				selected: true,
				selectedColor: theme.colors.primary,
			};
		}

		// Mark dates based on provider schedule
		// Generate next 90 days
		for (let i = 0; i < 90; i++) {
			const date = new Date(today);
			date.setUTCDate(date.getUTCDate() + i);
			const dayOfWeek = date.getUTCDay();
			const dateStr = formatUtcDateForApi(date);

			// If provider doesn't work on this day, mark as disabled
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

	const onSubmit = async (data: BookingFormData) => {
		const parsed = bookingFormSchema.safeParse(data);

		if (!parsed.success) {
			Alert.alert("Check the form", parsed.error.issues[0]?.message || "Please review the patient information.");
			return;
		}

		try {
			const formData = parsed.data;
			// Parse time (e.g., "2:00 PM" -> hours and minutes)
			const [time, period] = formData.selectedTime.split(" ");
			const [hours, minutes] = time.split(":").map(Number);
			const hour24 =
				period === "PM" && hours !== 12
					? hours + 12
					: period === "AM" && hours === 12
						? 0
						: hours;

			// Create datetime
			const appointmentDate = new Date(formData.selectedDate);
			appointmentDate.setUTCHours(hour24, minutes, 0, 0);

			const patient =
				formData.bookingFor === "self"
					? ({ type: "SELF" } as const)
					: formData.bookingFor === "existing"
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
									relationshipToCustomer: formData.patientRelationship,
									notes: formData.patientNotes,
									bloodType: formData.patientBloodType,
									medications: formData.patientMedications,
									allergies: formData.patientAllergies,
									chronicPain: formData.patientChronicPain,
									preExistingConditions:
										formData.patientPreExistingConditions,
									emergencyContactName:
										formData.patientEmergencyContactName,
									emergencyContactPhone:
										formData.patientEmergencyContactPhone,
								},
							} as const);

			await createAppointment.mutateAsync({
				healthcareProviderId: id,
				scheduledAt: appointmentDate.toISOString(),
				procedureIds,
				notes: formData.notes,
				patient,
			});

			// Show success message
			Alert.alert("Success", "Your appointment has been booked successfully!", [
				{
					text: "OK",
					onPress: () => router.push("/(bottom-tabs)/appointments"),
				},
			]);
		} catch (error) {
			Alert.alert("Error", getErrorMessage(error), [{ text: "OK" }]);
		}
	};

	const isBookingValid =
		selectedDate && selectedTime && !createAppointment.isPending;

	// Loading state
	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingText}>Loading booking details...</Text>
			</View>
		);
	}

	// Error state
	if (providerError || !provider) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>
					Failed to load provider information
				</Text>
				<Button onPress={() => router.back()} style={styles.errorButton}>
					Go Back
				</Button>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + 16 }]}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<ArrowLeft
						size={24}
						color={theme.colors.foreground}
						strokeWidth={2}
					/>
				</Pressable>
				<Text style={styles.headerTitle}>Book Appointment</Text>
				<View style={styles.headerSpacer} />
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 180 },
				]}
			>
				{/* Professional Info */}
				<View style={styles.professionalInfo}>
					<Image
						source={{ uri: provider.user.image || "https://i.pravatar.cc/150" }}
						style={styles.professionalImage}
					/>
					<View style={styles.professionalDetails}>
						<Text style={styles.professionalName}>{provider.user.name}</Text>
						<Text style={styles.professionalSpecialty}>
							{provider.specialty || "Healthcare Provider"}
						</Text>
						<View style={styles.professionalStats}>
							<View style={styles.statItem}>
								<Clock
									size={14}
									color={theme.colors.mutedForeground}
									strokeWidth={2}
								/>
								<Text style={styles.statText}>{totalDuration} min</Text>
							</View>
							<Text style={styles.priceText}>${totalPrice.toFixed(2)}</Text>
						</View>
					</View>
				</View>

				{/* Selected Procedures */}
				{selectedProcedures.length > 0 && (
					<View style={styles.proceduresSection}>
						<Text style={styles.sectionLabel}>Selected Procedures</Text>
						<View style={styles.proceduresList}>
							{selectedProcedures.map((procedure) => (
								<View key={procedure.id} style={styles.procedureItem}>
									<Text style={styles.procedureItemName} numberOfLines={1}>
										{procedure.name}
									</Text>
									<Text style={styles.procedureItemDuration}>
										{procedure.durationInMinutes} min
									</Text>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Patient */}
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
								bookingFor === "self" && styles.modeButtonActive,
							]}
							onPress={() => setValue("bookingFor", "self")}
						>
							<User
								size={18}
								color={
									bookingFor === "self"
										? theme.colors.primaryForeground
										: theme.colors.foreground
								}
								strokeWidth={2}
							/>
							<Text
								style={[
									styles.modeButtonText,
									bookingFor === "self" && styles.modeButtonTextActive,
								]}
							>
								Me
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.modeButton,
								bookingFor === "existing" && styles.modeButtonActive,
							]}
							onPress={() => {
								setValue("bookingFor", "existing");
								if (!selectedPatientProfileId && patientProfiles[0]) {
									setValue("existingPatientProfileId", patientProfiles[0].id);
								}
							}}
						>
							<Users
								size={18}
								color={
									bookingFor === "existing"
										? theme.colors.primaryForeground
										: theme.colors.foreground
								}
								strokeWidth={2}
							/>
							<Text
								style={[
									styles.modeButtonText,
									bookingFor === "existing" && styles.modeButtonTextActive,
								]}
							>
								Saved
							</Text>
						</Pressable>
						<Pressable
							style={[
								styles.modeButton,
								bookingFor === "new" && styles.modeButtonActive,
							]}
							onPress={() => setValue("bookingFor", "new")}
						>
							<UserPlus
								size={18}
								color={
									bookingFor === "new"
										? theme.colors.primaryForeground
										: theme.colors.foreground
								}
								strokeWidth={2}
							/>
							<Text
								style={[
									styles.modeButtonText,
									bookingFor === "new" && styles.modeButtonTextActive,
								]}
							>
								New
							</Text>
						</Pressable>
					</View>

					{bookingFor === "existing" ? (
						<View style={styles.patientProfilesList}>
							{patientProfiles.length === 0 ? (
								<Text style={styles.emptyPatientText}>
									No saved patient profiles yet.
								</Text>
							) : (
								patientProfiles.map((profile) => {
									const selected = profile.id === selectedPatientProfileId;

									return (
										<Pressable
											key={profile.id}
											style={[
												styles.patientProfileOption,
												selected && styles.patientProfileOptionActive,
											]}
											onPress={() =>
												setValue("existingPatientProfileId", profile.id)
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
													{[
														profile.relationshipToCustomer,
														profile.phone,
													]
														.filter(Boolean)
														.join(" • ") || "Saved patient"}
												</Text>
											</View>
										</Pressable>
									);
								})
							)}
						</View>
					) : null}

					{bookingFor === "new" ? (
						<View style={styles.patientForm}>
							<Text style={styles.fieldGroupTitle}>Basic information</Text>
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
									name="patientRelationship"
									render={({ field: { value, onChange } }) => (
										<Input
											placeholder="Relationship"
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
											keyboardType="email-address"
											autoCapitalize="none"
											containerStyle={styles.fieldHalf}
										/>
									)}
								/>
							</View>
							<View style={styles.fieldRow}>
								<Controller
									control={control}
									name="patientCpf"
									render={({ field: { value, onChange } }) => (
										<Input
											placeholder="CPF"
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
										placeholder="Pre-existing conditions, chronic pain, surgeries..."
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
										placeholder="Anything else the provider should know"
										value={value}
										onChangeText={onChange}
									/>
								)}
							/>
						</View>
					) : null}
				</View>

				{/* Select Date */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<CalendarIcon
							size={20}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
						<Text style={styles.sectionTitle}>Select Date</Text>
					</View>

					<Controller
						control={control}
						name="selectedDate"
						rules={{ required: "Please select a date" }}
						render={({ field: { onChange } }) => (
							<>
								{schedulesLoading ? (
									<View style={styles.loadingSlots}>
										<ActivityIndicator
											size="small"
											color={theme.colors.primary}
										/>
										<Text style={styles.loadingText}>Loading calendar...</Text>
									</View>
								) : (
									<Calendar
										current={formattedDate}
										minDate={minDate}
										maxDate={maxDate}
										onDayPress={(day) => {
											onChange(parseCalendarDateAsUtc(day.dateString));
											setValue("selectedTime", ""); // Reset time when date changes
										}}
										markedDates={markedDates}
										theme={{
											backgroundColor: theme.colors.background,
											calendarBackground: theme.colors.surfacePrimary,
											textSectionTitleColor: theme.colors.mutedForeground,
											selectedDayBackgroundColor: theme.colors.primary,
											selectedDayTextColor: theme.colors.primaryForeground,
											todayTextColor: theme.colors.primary,
											dayTextColor: theme.colors.foreground,
											textDisabledColor: theme.colors.mutedForeground,
											dotColor: theme.colors.primary,
											selectedDotColor: theme.colors.primaryForeground,
											arrowColor: theme.colors.primary,
											monthTextColor: theme.colors.foreground,
											indicatorColor: theme.colors.primary,
											textDayFontWeight: "400",
											textMonthFontWeight: "600",
											textDayHeaderFontWeight: "600",
											textDayFontSize: 14,
											textMonthFontSize: 16,
											textDayHeaderFontSize: 12,
										}}
										style={styles.calendarComponent}
									/>
								)}
							</>
						)}
					/>
				</View>

				{/* Select Time */}
				<TimeSlotSelector
					control={control}
					healthcareProviderId={id}
					selectedDate={selectedDate}
					selectedProcedures={selectedProcedures}
				/>

				{/* Additional Notes */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
					<Controller
						control={control}
						name="notes"
						render={({ field: { value, onChange } }) => (
							<Textarea
								placeholder="Tell us about your symptoms or reason for visit..."
								value={value}
								onChangeText={onChange}
								style={styles.notesInput}
							/>
						)}
					/>
				</View>
			</ScrollView>

			{/* Fixed Bottom Section */}
			<View
				style={[
					styles.bottomBar,
					{
						paddingBottom: insets.bottom + 16,
					},
				]}
			>
				{selectedDate && selectedTime && (
					<View style={styles.appointmentSummary}>
						<Text style={styles.appointmentLabel}>Your appointment</Text>
						<Text style={styles.appointmentDetails}>
							{appointmentPatientLabel} • {formatUtcDateForDisplay(selectedDate)}{" "}
							at {selectedTime}
						</Text>
					</View>
				)}
				<Button
					style={styles.confirmButton}
					disabled={!isBookingValid}
					loading={createAppointment.isPending}
					onPress={handleSubmit(onSubmit)}
				>
					{createAppointment.isPending ? "Booking..." : "Confirm Booking"}
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(3),
		backgroundColor: theme.colors.background,
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(3),
		backgroundColor: theme.colors.background,
	},
	errorText: {
		fontSize: 16,
		color: theme.colors.destructive,
		marginBottom: theme.gap(3),
		textAlign: "center",
	},
	errorButton: {
		borderRadius: theme.radius.full,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: theme.colors.surfacePrimary,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(2),
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	headerSpacer: {
		width: 40,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: theme.gap(3),
	},
	professionalInfo: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: `${theme.colors.primary}1A`,
		marginHorizontal: theme.gap(3),
		padding: theme.gap(2),
		borderRadius: theme.radius.xl,
		gap: theme.gap(2),
	},
	professionalImage: {
		width: 64,
		height: 64,
		borderRadius: theme.radius.xl,
	},
	professionalDetails: {
		flex: 1,
	},
	professionalName: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(0.5),
	},
	professionalSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(1),
	},
	professionalStats: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	statText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	priceText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	proceduresSection: {
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		paddingVertical: theme.gap(2),
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: theme.colors.border,
	},
	sectionLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	proceduresList: {
		gap: theme.gap(1),
	},
	procedureItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	procedureItemName: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		flex: 1,
	},
	procedureItemDuration: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	modeGrid: {
		flexDirection: "row",
		gap: theme.gap(1),
		marginTop: theme.gap(1),
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
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	modeButtonTextActive: {
		color: theme.colors.primaryForeground,
	},
	patientProfilesList: {
		marginTop: theme.gap(2),
		gap: theme.gap(1.5),
	},
	emptyPatientText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		paddingVertical: theme.gap(3),
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
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	patientProfileMeta: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	patientForm: {
		marginTop: theme.gap(2),
		gap: theme.gap(1.5),
	},
	fieldGroupTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
		textTransform: "uppercase",
		marginTop: theme.gap(1),
	},
	fieldRow: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	fieldHalf: {
		flex: 1,
	},
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
		gap: theme.gap(1.5),
		marginBottom: theme.gap(2),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(2),
	},
	calendarComponent: {
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		overflow: "hidden",
	},
	loadingSlots: {
		paddingVertical: theme.gap(4),
		alignItems: "center",
		justifyContent: "center",
	},
	notesInput: {
		marginTop: theme.gap(1),
	},
	bottomBar: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.surfacePrimary,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(2),
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 5,
	},
	appointmentSummary: {
		backgroundColor: `${theme.colors.primary}1A`,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	appointmentLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	appointmentDetails: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	confirmButton: {
		borderRadius: theme.radius.full,
	},
}));
