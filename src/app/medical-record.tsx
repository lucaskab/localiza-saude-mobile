import { useEffect, useMemo } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	Activity,
	AlertCircle,
	ArrowLeft,
	Droplets,
	HeartPulse,
	Phone,
	Pill,
	Save,
	ShieldPlus,
	Users,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth";
import {
	useMyMedicalRecord,
	useUpsertMyMedicalRecord,
} from "@/hooks/use-medical-record";
import { getErrorMessage } from "@/services/api";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

const medicalTextSchema = z.string().transform((value) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
});
const bloodTypeSchema = z.enum(BLOOD_TYPES).nullable();

const medicalRecordFormSchema = z.object({
	bloodType: bloodTypeSchema,
	medications: medicalTextSchema,
	chronicPain: medicalTextSchema,
	preExistingConditions: medicalTextSchema,
	allergies: medicalTextSchema,
	surgeries: medicalTextSchema,
	familyHistory: medicalTextSchema,
	lifestyleNotes: medicalTextSchema,
	emergencyContactName: medicalTextSchema,
	emergencyContactPhone: medicalTextSchema,
});

type MedicalRecordFormValues = z.input<typeof medicalRecordFormSchema>;
type MedicalRecordPayload = z.output<typeof medicalRecordFormSchema>;

const emptyForm: MedicalRecordFormValues = {
	bloodType: null,
	medications: "",
	chronicPain: "",
	preExistingConditions: "",
	allergies: "",
	surgeries: "",
	familyHistory: "",
	lifestyleNotes: "",
	emergencyContactName: "",
	emergencyContactPhone: "",
};

const parseBloodType = (
	value: string | null,
): MedicalRecordFormValues["bloodType"] => {
	const parsed = bloodTypeSchema.safeParse(value);
	return parsed.success ? parsed.data : null;
};

function FieldLabel({
	icon: Icon,
	label,
}: {
	icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
	label: string;
}) {
	const { theme } = useUnistyles();

	return (
		<View style={styles.fieldLabel}>
			<Icon size={16} color={theme.colors.primary} strokeWidth={2.2} />
			<Text style={styles.fieldLabelText}>{label}</Text>
		</View>
	);
}

export default function MedicalRecordScreen() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const { user } = useAuth();
	const { data, isLoading, error, refetch } = useMyMedicalRecord(!!user?.id);
	const upsertMutation = useUpsertMyMedicalRecord();
	const { control, handleSubmit, reset } = useForm<MedicalRecordFormValues>({
		defaultValues: emptyForm,
	});
	const formValues = useWatch({ control });

	useEffect(() => {
		const record = data?.medicalRecord;

		if (!record) {
			reset(emptyForm);
			return;
		}

		reset({
			bloodType: parseBloodType(record.bloodType),
			medications: record.medications || "",
			chronicPain: record.chronicPain || "",
			preExistingConditions: record.preExistingConditions || "",
			allergies: record.allergies || "",
			surgeries: record.surgeries || "",
			familyHistory: record.familyHistory || "",
			lifestyleNotes: record.lifestyleNotes || "",
			emergencyContactName: record.emergencyContactName || "",
			emergencyContactPhone: record.emergencyContactPhone || "",
		});
	}, [data?.medicalRecord, reset]);

	const completedSections = useMemo(() => {
		const parsed = medicalRecordFormSchema.safeParse({
			...emptyForm,
			...formValues,
		});

		if (!parsed.success) {
			return 0;
		}

		return [
			parsed.data.bloodType,
			parsed.data.medications,
			parsed.data.chronicPain,
			parsed.data.preExistingConditions,
			parsed.data.allergies,
			parsed.data.emergencyContactName,
			parsed.data.emergencyContactPhone,
		].filter(Boolean).length;
	}, [formValues]);

	const handleSave = async (values: MedicalRecordFormValues) => {
		try {
			const payload: MedicalRecordPayload = medicalRecordFormSchema.parse(values);

			await upsertMutation.mutateAsync(payload);
			Alert.alert("Saved", "Your medical record was updated successfully.");
		} catch (saveError) {
			Alert.alert("Error", getErrorMessage(saveError));
		}
	};

	if (!user?.id) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.header}>
					<Pressable onPress={() => router.back()} style={styles.backButton}>
						<ArrowLeft size={22} color={theme.colors.foreground} />
					</Pressable>
					<Text style={styles.headerTitle}>Medical Record</Text>
				</View>
				<View style={styles.centerState}>
					<ShieldPlus size={34} color={theme.colors.primary} strokeWidth={2.2} />
					<Text style={styles.emptyTitle}>Sign in required</Text>
					<Text style={styles.emptyText}>
						Sign in to create and update your medical record.
					</Text>
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
					<Text style={styles.headerTitle}>Medical Record</Text>
					<Text style={styles.headerSubtitle}>
						Shared with providers before appointments
					</Text>
				</View>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				style={styles.keyboardView}
			>
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
							<Text style={styles.emptyText}>Loading medical record...</Text>
						</View>
					) : null}

					{error && !isLoading ? (
						<View style={styles.centerState}>
							<AlertCircle
								size={34}
								color={theme.colors.destructive}
								strokeWidth={2.2}
							/>
							<Text style={styles.emptyTitle}>Could not load your record</Text>
							<Text style={styles.emptyText}>Refresh and try again.</Text>
							<Button onPress={() => refetch()} style={styles.retryButton}>
								Retry
							</Button>
						</View>
					) : null}

					{!isLoading && !error ? (
						<>
							<View style={styles.summaryCard}>
								<View style={styles.summaryIcon}>
									<ShieldPlus
										size={24}
										color={theme.colors.primary}
										strokeWidth={2.2}
									/>
								</View>
								<View style={styles.summaryContent}>
									<Text style={styles.summaryTitle}>Keep this ready</Text>
									<Text style={styles.summaryText}>
										{completedSections} key field
										{completedSections === 1 ? "" : "s"} filled for upcoming
										appointments.
									</Text>
								</View>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={Droplets} label="Blood type" />
								<Controller
									control={control}
									name="bloodType"
									render={({ field }) => (
										<View style={styles.bloodTypeGrid}>
											{BLOOD_TYPES.map((bloodType) => {
												const isSelected = field.value === bloodType;

												return (
													<Pressable
														key={bloodType}
														onPress={() =>
															field.onChange(isSelected ? null : bloodType)
														}
														style={[
															styles.bloodTypeButton,
															isSelected && styles.bloodTypeButtonSelected,
														]}
													>
														<Text
															style={[
																styles.bloodTypeText,
																isSelected && styles.bloodTypeTextSelected,
															]}
														>
															{bloodType}
														</Text>
													</Pressable>
												);
											})}
										</View>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={Pill} label="Medications" />
								<Controller
									control={control}
									name="medications"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="List medication names, doses, and frequency"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={Activity} label="Chronic pain" />
								<Controller
									control={control}
									name="chronicPain"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Describe recurring pain, location, intensity, and duration"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={HeartPulse} label="Pre-existing conditions" />
								<Controller
									control={control}
									name="preExistingConditions"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Examples: asthma, diabetes, hypertension"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={AlertCircle} label="Allergies" />
								<Controller
									control={control}
									name="allergies"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Medication, food, latex, or other allergies"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={ShieldPlus} label="Surgeries" />
								<Controller
									control={control}
									name="surgeries"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Previous surgeries and approximate dates"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={Users} label="Family history" />
								<Controller
									control={control}
									name="familyHistory"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Relevant conditions in close relatives"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={HeartPulse} label="Lifestyle notes" />
								<Controller
									control={control}
									name="lifestyleNotes"
									render={({ field }) => (
										<Textarea
											value={field.value}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											placeholder="Sleep, exercise, smoking, alcohol, diet, or other notes"
										/>
									)}
								/>
							</View>

							<View style={styles.section}>
								<FieldLabel icon={Phone} label="Emergency contact" />
								<View style={styles.contactFields}>
									<Controller
										control={control}
										name="emergencyContactName"
										render={({ field }) => (
											<Input
												value={field.value}
												onChangeText={field.onChange}
												onBlur={field.onBlur}
												placeholder="Contact name"
											/>
										)}
									/>
									<Controller
										control={control}
										name="emergencyContactPhone"
										render={({ field }) => (
											<Input
												value={field.value}
												onChangeText={field.onChange}
												onBlur={field.onBlur}
												placeholder="Contact phone"
												keyboardType="phone-pad"
											/>
										)}
									/>
								</View>
							</View>

							<Button
								onPress={handleSubmit(handleSave)}
								loading={upsertMutation.isPending}
								disabled={upsertMutation.isPending}
								style={styles.saveButton}
							>
								<View style={styles.saveButtonContent}>
									<Save
										size={17}
										color={theme.colors.primaryForeground}
										strokeWidth={2.2}
									/>
									<Text style={styles.saveButtonText}>Save Medical Record</Text>
								</View>
							</Button>
						</>
					) : null}
				</ScrollView>
			</KeyboardAvoidingView>
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
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: theme.gap(2),
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
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	keyboardView: {
		flex: 1,
	},
	scrollContent: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	centerState: {
		minHeight: 320,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(4),
		gap: theme.gap(2),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
		textAlign: "center",
	},
	emptyText: {
		fontSize: 14,
		lineHeight: 20,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	retryButton: {
		minWidth: 140,
		marginTop: theme.gap(1),
	},
	summaryCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	summaryIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
	},
	summaryContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	summaryTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	summaryText: {
		fontSize: 13,
		lineHeight: 19,
		color: theme.colors.mutedForeground,
	},
	section: {
		gap: theme.gap(1.5),
	},
	fieldLabel: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	fieldLabelText: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	bloodTypeGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	bloodTypeButton: {
		minWidth: 64,
		height: 42,
		borderRadius: theme.radius.full,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(2),
	},
	bloodTypeButtonSelected: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	bloodTypeText: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	bloodTypeTextSelected: {
		color: theme.colors.primaryForeground,
	},
	contactFields: {
		gap: theme.gap(1.5),
	},
	saveButton: {
		marginTop: theme.gap(1),
	},
	saveButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
}));
