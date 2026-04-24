import { useEffect, useMemo, useState, useRef } from "react";
import {
	Save,
	Plus,
	Trash2,
	AlertCircle,
	ClipboardPlus,
	Edit2,
	User,
	Briefcase,
	FileText,
	Clock,
	DollarSign,
	LogOut,
} from "lucide-react-native";
import {
	View,
	Text,
	ScrollView,
	Pressable,
	ActivityIndicator,
	Alert,
	type ScrollView as ScrollViewType,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useProceduresByProvider,
	useCreateProcedure,
	useUpdateProcedure,
	useDeleteProcedure,
	useUpdateHealthcareProvider,
} from "@/hooks/use-procedures";

// Zod schemas for types only (no runtime validation with zodResolver)
const procedureSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().nullable(),
	priceInCents: z.number(),
	durationInMinutes: z.number(),
	_isNew: z.boolean().optional(),
	_isDeleted: z.boolean().optional(),
});

const profileFormSchema = z.object({
	profile: z.object({
		specialty: z.string(),
		professionalId: z.string().nullable(),
		bio: z.string().nullable(),
	}),
	procedures: z.array(procedureSchema),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type ProcedureData = z.infer<typeof procedureSchema>;

export default function ProviderProfile() {
	const { theme } = useUnistyles();
	const router = useRouter();
	const { healthcareProvider, signOut } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [editingProcedureIndex, setEditingProcedureIndex] = useState<
		number | null
	>(null);
	const [priceInputValues, setPriceInputValues] = useState<Map<number, string>>(
		new Map(),
	);
	const scrollViewRef = useRef<ScrollViewType>(null);

	// Fetch procedures
	const {
		data: proceduresData,
		isLoading,
		error,
		refetch,
	} = useProceduresByProvider({
		healthcareProviderId: healthcareProvider?.id || "",
		enabled: !!healthcareProvider?.id,
	});

	// Mutations
	const updateProviderMutation = useUpdateHealthcareProvider();
	const createProcedureMutation = useCreateProcedure();
	const updateProcedureMutation = useUpdateProcedure();
	const deleteProcedureMutation = useDeleteProcedure();

	// Transform backend data to form data
	const defaultValues = useMemo((): ProfileFormData => {
		return {
			profile: {
				specialty: healthcareProvider?.specialty || "",
				professionalId: healthcareProvider?.professionalId || null,
				bio: healthcareProvider?.bio || null,
			},
			procedures:
				proceduresData?.procedures.map((proc) => ({
					id: proc.id,
					name: proc.name,
					description: proc.description,
					priceInCents: proc.priceInCents,
					durationInMinutes: proc.durationInMinutes,
				})) || [],
		};
	}, [healthcareProvider, proceduresData]);

	// Initialize form
	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<ProfileFormData>({
		defaultValues,
	});

	// Reset form when data loads
	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	// Manual validation functions
	const validateProfile = (profile: ProfileFormData["profile"]): boolean => {
		if (!profile.specialty || profile.specialty.trim().length === 0) {
			Alert.alert("Validation Error", "Specialty is required");
			return false;
		}
		return true;
	};

	const validateProcedure = (procedure: ProcedureData): boolean => {
		if (procedure._isDeleted) return true;

		if (!procedure.name || procedure.name.trim().length === 0) {
			Alert.alert("Validation Error", "Procedure name is required");
			return false;
		}

		if (procedure.priceInCents < 0) {
			Alert.alert("Validation Error", "Price must be 0 or greater");
			return false;
		}

		if (procedure.durationInMinutes < 1) {
			Alert.alert("Validation Error", "Duration must be at least 1 minute");
			return false;
		}

		return true;
	};

	// Handle save
	const onSubmit = async (data: ProfileFormData) => {
		if (!healthcareProvider?.id) return;

		// Manual validation
		if (!validateProfile(data.profile)) {
			return;
		}

		for (const procedure of data.procedures) {
			if (!validateProcedure(procedure)) {
				return;
			}
		}

		setIsSaving(true);

		try {
			const operations: Promise<unknown>[] = [];

			// Check if profile changed
			const profileChanged =
				data.profile.specialty !== defaultValues.profile.specialty ||
				data.profile.professionalId !== defaultValues.profile.professionalId ||
				data.profile.bio !== defaultValues.profile.bio;

			if (profileChanged) {
				operations.push(
					updateProviderMutation.mutateAsync({
						providerId: healthcareProvider.id,
						data: {
							specialty: data.profile.specialty,
							professionalId: data.profile.professionalId,
							bio: data.profile.bio,
						},
					}),
				);
			}

			// Process procedures
			for (const procedure of data.procedures) {
				if (procedure._isDeleted && procedure.id) {
					// Delete procedure
					operations.push(deleteProcedureMutation.mutateAsync(procedure.id));
				} else if (procedure._isNew) {
					// Create new procedure
					operations.push(
						createProcedureMutation.mutateAsync({
							name: procedure.name,
							description: procedure.description,
							priceInCents: procedure.priceInCents,
							durationInMinutes: procedure.durationInMinutes,
							healthcareProviderId: healthcareProvider.id,
						}),
					);
				} else if (procedure.id) {
					// Check if procedure was updated
					const originalProcedure = defaultValues.procedures.find(
						(p) => p.id === procedure.id,
					);
					const wasUpdated =
						!originalProcedure ||
						originalProcedure.name !== procedure.name ||
						originalProcedure.description !== procedure.description ||
						originalProcedure.priceInCents !== procedure.priceInCents ||
						originalProcedure.durationInMinutes !== procedure.durationInMinutes;

					if (wasUpdated) {
						operations.push(
							updateProcedureMutation.mutateAsync({
								procedureId: procedure.id,
								data: {
									name: procedure.name,
									description: procedure.description,
									priceInCents: procedure.priceInCents,
									durationInMinutes: procedure.durationInMinutes,
								},
							}),
						);
					}
				}
			}

			// Execute all operations in batch
			await Promise.all(operations);

			// Refetch data and reset form
			await refetch();
			setEditingProcedureIndex(null);
			Alert.alert("Success", "Profile saved successfully!");
		} catch (error) {
			console.error("Failed to save profile:", error);
			Alert.alert("Error", "Failed to save profile. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const handleSignOut = () => {
		Alert.alert("Logout", "Do you want to sign out of your account?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Logout",
				style: "destructive",
				onPress: () => signOut(),
			},
		]);
	};

	// Render profile section
	const renderProfileSection = () => {
		return (
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Profile Information</Text>

				{/* Read-only fields */}
				<View style={styles.card}>
					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>Name</Text>
						<View style={styles.readOnlyField}>
							<User size={16} color={theme.colors.mutedForeground} />
							<Text style={styles.readOnlyText}>
								{healthcareProvider?.user?.name || "Not set"}
							</Text>
						</View>
					</View>

					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>Email</Text>
						<View style={styles.readOnlyField}>
							<Text style={styles.readOnlyText}>
								{healthcareProvider?.user?.email || "Not set"}
							</Text>
						</View>
					</View>
				</View>

				{/* Editable fields */}
				<View style={styles.card}>
					<Controller
						control={control}
						name="profile.specialty"
						render={({ field }) => (
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>
									Specialty <Text style={styles.required}>*</Text>
								</Text>
								<Input
									leftIcon={Briefcase}
									value={field.value}
									onChangeText={field.onChange}
									placeholder="e.g., Cardiologist"
								/>
							</View>
						)}
					/>

					<Controller
						control={control}
						name="profile.professionalId"
						render={({ field }) => (
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>Professional ID</Text>
								<Input
									leftIcon={FileText}
									value={field.value || ""}
									onChangeText={field.onChange}
									placeholder="e.g., CRM 12345"
								/>
							</View>
						)}
					/>

					<Controller
						control={control}
						name="profile.bio"
						render={({ field }) => (
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>Bio</Text>
								<Input
									value={field.value || ""}
									onChangeText={field.onChange}
									placeholder="Tell patients about yourself..."
									multiline
								/>
							</View>
						)}
					/>
				</View>
			</View>
		);
	};

	// Render procedures section
	const renderProceduresSection = () => {
		return (
			<Controller
				control={control}
				name="procedures"
				render={({ field }) => {
					const procedures = field.value;
					const visibleProcedures = procedures.filter((p) => !p._isDeleted);

					const addProcedure = () => {
						const newProcedure: ProcedureData = {
							name: "",
							description: null,
							priceInCents: 0,
							durationInMinutes: 30,
							_isNew: true,
						};
						field.onChange([newProcedure, ...procedures]);
						setEditingProcedureIndex(0);
						// Scroll to top to show the new procedure form
						setTimeout(() => {
							scrollViewRef.current?.scrollTo({ y: 0, animated: true });
						}, 100);
					};

					const removeProcedure = (index: number) => {
						const procedure = procedures[index];
						if (procedure.id) {
							// Mark as deleted
							const updated = [...procedures];
							updated[index] = { ...procedure, _isDeleted: true };
							field.onChange(updated);
						} else {
							// Remove if it's new
							field.onChange(procedures.filter((_, i) => i !== index));
						}
						setEditingProcedureIndex(null);
					};

					const updateProcedureField = (
						index: number,
						fieldName: keyof ProcedureData,
						value: string | number | null,
					) => {
						const updated = [...procedures];
						updated[index] = { ...updated[index], [fieldName]: value };
						field.onChange(updated);
					};

					return (
						<View style={styles.section}>
							<View style={styles.sectionHeader}>
								<Text style={styles.sectionTitle}>Procedures</Text>
								<Button variant="outline" size="sm" onPress={addProcedure}>
									<View style={styles.buttonContent}>
										<Plus
											size={16}
											color={theme.colors.foreground}
											strokeWidth={2}
										/>
										<Text style={styles.buttonText}>Add Procedure</Text>
									</View>
								</Button>
							</View>

							{visibleProcedures.length === 0 ? (
								<View style={styles.emptyState}>
									<Briefcase
										size={48}
										color={theme.colors.mutedForeground}
										strokeWidth={1.5}
									/>
									<Text style={styles.emptyText}>No procedures yet</Text>
									<Text style={styles.emptySubtext}>
										Add procedures to let patients know what services you offer
									</Text>
								</View>
							) : (
								<View style={styles.proceduresList}>
									{visibleProcedures.map((procedure) => {
										const actualIndex = procedures.findIndex(
											(p) => p === procedure,
										);
										const isEditing = editingProcedureIndex === actualIndex;

										return (
											<View key={actualIndex} style={styles.procedureCard}>
												{isEditing ? (
													// Edit mode
													<View style={styles.procedureEditForm}>
														<View style={styles.fieldGroup}>
															<Text style={styles.fieldLabel}>
																Name <Text style={styles.required}>*</Text>
															</Text>
															<Input
																value={procedure.name}
																onChangeText={(text) =>
																	updateProcedureField(
																		actualIndex,
																		"name",
																		text,
																	)
																}
																placeholder="e.g., Consultation"
															/>
														</View>

														<View style={styles.fieldGroup}>
															<Text style={styles.fieldLabel}>Description</Text>
															<Input
																value={procedure.description || ""}
																onChangeText={(text) =>
																	updateProcedureField(
																		actualIndex,
																		"description",
																		text || null,
																	)
																}
																placeholder="Describe the procedure..."
																multiline
															/>
														</View>

														<View style={styles.fieldRow}>
															<View style={styles.fieldGroupHalf}>
																<Text style={styles.fieldLabel}>
																	Duration (minutes){" "}
																	<Text style={styles.required}>*</Text>
																</Text>
																<Input
																	leftIcon={Clock}
																	value={
																		procedure.durationInMinutes === 0
																			? ""
																			: procedure.durationInMinutes.toString()
																	}
																	onChangeText={(text) => {
																		const value = text.replace(/[^0-9]/g, "");
																		updateProcedureField(
																			actualIndex,
																			"durationInMinutes",
																			value ? Number.parseInt(value) : 0,
																		);
																	}}
																	placeholder="30"
																	keyboardType="number-pad"
																/>
															</View>

															<View style={styles.fieldGroupHalf}>
																<Text style={styles.fieldLabel}>
																	Price (R$){" "}
																	<Text style={styles.required}>*</Text>
																</Text>
																<Input
																	leftIcon={DollarSign}
																	value={
																		priceInputValues.has(actualIndex)
																			? priceInputValues.get(actualIndex)
																			: procedure.priceInCents === 0
																				? ""
																				: (
																						procedure.priceInCents / 100
																					).toFixed(2)
																	}
																	onChangeText={(text) => {
																		// Only allow numbers and decimal point
																		const cleaned = text.replace(
																			/[^0-9.]/g,
																			"",
																		);

																		// Prevent multiple decimal points
																		const parts = cleaned.split(".");
																		const formatted =
																			parts.length > 2
																				? parts[0] +
																					"." +
																					parts.slice(1).join("")
																				: cleaned;

																		// Update local state for display
																		setPriceInputValues((prev) => {
																			const newMap = new Map(prev);
																			newMap.set(actualIndex, formatted);
																			return newMap;
																		});

																		// Update form value in cents
																		const cents = Math.round(
																			(parseFloat(formatted) || 0) * 100,
																		);
																		updateProcedureField(
																			actualIndex,
																			"priceInCents",
																			cents,
																		);
																	}}
																	onBlur={() => {
																		// Format to 2 decimals on blur
																		const currentValue =
																			priceInputValues.get(actualIndex) || "";
																		const parsed =
																			parseFloat(currentValue) || 0;
																		const formatted = parsed.toFixed(2);
																		setPriceInputValues((prev) => {
																			const newMap = new Map(prev);
																			newMap.set(actualIndex, formatted);
																			return newMap;
																		});
																		const cents = Math.round(parsed * 100);
																		updateProcedureField(
																			actualIndex,
																			"priceInCents",
																			cents,
																		);
																	}}
																	placeholder="0.00"
																	keyboardType="decimal-pad"
																/>
															</View>
														</View>

														<View style={styles.procedureActions}>
															<Button
																variant="outline"
																size="sm"
																onPress={() => setEditingProcedureIndex(null)}
															>
																<Text style={styles.buttonText}>Done</Text>
															</Button>
															<Button
																variant="destructive"
																size="sm"
																onPress={() => {
																	Alert.alert(
																		"Delete Procedure",
																		"Are you sure you want to delete this procedure?",
																		[
																			{ text: "Cancel", style: "cancel" },
																			{
																				text: "Delete",
																				style: "destructive",
																				onPress: () =>
																					removeProcedure(actualIndex),
																			},
																		],
																	);
																}}
															>
																<Trash2
																	size={16}
																	color={theme.colors.destructiveForeground}
																	strokeWidth={2}
																/>
															</Button>
														</View>
													</View>
												) : (
													// View mode
													<>
														<View style={styles.procedureHeader}>
															<Text style={styles.procedureName}>
																{procedure.name}
															</Text>
															<Pressable
																onPress={() =>
																	setEditingProcedureIndex(actualIndex)
																}
																style={styles.editButton}
															>
																<Edit2
																	size={18}
																	color={theme.colors.primary}
																	strokeWidth={2}
																/>
															</Pressable>
														</View>

														{procedure.description && (
															<Text style={styles.procedureDescription}>
																{procedure.description}
															</Text>
														)}

														<View style={styles.procedureMetadata}>
															<View style={styles.metadataItem}>
																<Clock
																	size={14}
																	color={theme.colors.mutedForeground}
																	strokeWidth={2}
																/>
																<Text style={styles.metadataText}>
																	{procedure.durationInMinutes} min
																</Text>
															</View>
															<View style={styles.metadataItem}>
																<DollarSign
																	size={14}
																	color={theme.colors.mutedForeground}
																	strokeWidth={2}
																/>
																<Text style={styles.metadataText}>
																	R$ {(procedure.priceInCents / 100).toFixed(2)}
																</Text>
															</View>
														</View>
													</>
												)}
											</View>
										);
									})}
								</View>
							)}
						</View>
					);
				}}
			/>
		);
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				ref={scrollViewRef}
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>Loading profile...</Text>
					</View>
				) : error ? (
					<View style={styles.errorContainer}>
						<AlertCircle
							size={48}
							color={theme.colors.destructive}
							strokeWidth={2}
						/>
						<Text style={styles.errorText}>Failed to load profile</Text>
						<Button onPress={() => refetch()} size="sm">
							Retry
						</Button>
					</View>
				) : (
					<>
						{renderProfileSection()}
						{renderProceduresSection()}
						<View style={styles.section}>
							<Text style={styles.sectionTitle}>Account</Text>
							<Pressable
								onPress={() => router.push("/medical-record")}
								style={({ pressed }) => [
									styles.accountCard,
									pressed && styles.accountCardPressed,
								]}
							>
								<View style={styles.accountIconContainer}>
									<ClipboardPlus
										size={20}
										color={theme.colors.primary}
										strokeWidth={2}
									/>
								</View>
								<View style={styles.accountContent}>
									<Text style={styles.accountTitle}>Medical Record</Text>
									<Text style={styles.accountDescription}>
										Manage your personal health information
									</Text>
								</View>
							</Pressable>
							<Pressable
								onPress={handleSignOut}
								style={({ pressed }) => [
									styles.logoutCard,
									pressed && styles.logoutCardPressed,
								]}
							>
								<View style={styles.logoutIconContainer}>
									<LogOut
										size={20}
										color={theme.colors.destructive}
										strokeWidth={2}
									/>
								</View>
								<View style={styles.logoutContent}>
									<Text style={styles.logoutTitle}>Logout</Text>
									<Text style={styles.logoutDescription}>
										Sign out of your provider account
									</Text>
								</View>
							</Pressable>
						</View>
					</>
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
						<View style={styles.buttonContent}>
							<Save size={20} color={theme.colors.primaryForeground} />
							<Text style={styles.saveButtonText}>Save Changes</Text>
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
		paddingBottom: theme.gap(20),
	},
	loadingContainer: {
		paddingVertical: theme.gap(8),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 16,
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
	section: {
		marginBottom: theme.gap(4),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(3),
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	card: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(3),
	},
	fieldGroup: {
		gap: theme.gap(1.5),
	},
	fieldGroupHalf: {
		flex: 1,
		gap: theme.gap(1.5),
	},
	fieldRow: {
		flexDirection: "row",
		gap: theme.gap(2),
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	required: {
		color: theme.colors.destructive,
	},
	readOnlyField: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(2.5),
		paddingVertical: theme.gap(2),
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	readOnlyText: {
		fontSize: 15,
		color: theme.colors.mutedForeground,
	},

	emptyState: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(8),
		gap: theme.gap(2),
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	emptySubtext: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		maxWidth: 280,
	},
	proceduresList: {
		gap: theme.gap(2),
	},
	procedureCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	procedureHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(1),
	},
	procedureName: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
		flex: 1,
	},
	editButton: {
		padding: theme.gap(1),
	},
	procedureDescription: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(2),
		lineHeight: 20,
	},
	procedureMetadata: {
		flexDirection: "row",
		gap: theme.gap(3),
	},
	metadataItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	metadataText: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	accountCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		marginBottom: theme.gap(2),
	},
	accountCardPressed: {
		backgroundColor: theme.colors.secondary,
	},
	accountIconContainer: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	accountContent: {
		flex: 1,
	},
	accountTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	accountDescription: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	logoutCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	logoutCardPressed: {
		backgroundColor: `${theme.colors.destructive}12`,
	},
	logoutIconContainer: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: `${theme.colors.destructive}1A`,
		alignItems: "center",
		justifyContent: "center",
	},
	logoutContent: {
		flex: 1,
	},
	logoutTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: theme.colors.destructive,
	},
	logoutDescription: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	procedureEditForm: {
		gap: theme.gap(3),
	},
	procedureActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	buttonText: {
		fontSize: 14,
		color: theme.colors.foreground,
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
		shadowRadius: 3,
		elevation: 5,
	},
	saveButton: {
		width: "100%",
		borderRadius: theme.radius.lg,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
}));
