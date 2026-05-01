import { useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
	type ScrollView as ScrollViewType,
} from "react-native";
import {
	AlertCircle,
	ArrowLeft,
	Briefcase,
	Clock,
	DollarSign,
	Edit2,
	Plus,
	Save,
	Trash2,
} from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useCreateProcedure,
	useDeleteProcedure,
	useProceduresByProvider,
	useUpdateProcedure,
} from "@/hooks/use-procedures";

const procedureSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	description: z.string().nullable(),
	priceInCents: z.number(),
	durationInMinutes: z.number(),
	_isNew: z.boolean().optional(),
	_isDeleted: z.boolean().optional(),
});

const proceduresFormSchema = z.object({
	procedures: z.array(procedureSchema),
});

type ProceduresFormData = z.infer<typeof proceduresFormSchema>;
type ProcedureData = z.infer<typeof procedureSchema>;

export default function ProviderProcedures() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const router = useRouter();
	const { healthcareProvider } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [editingProcedureIndex, setEditingProcedureIndex] = useState<
		number | null
	>(null);
	const [priceInputValues, setPriceInputValues] = useState<Map<number, string>>(
		new Map(),
	);
	const scrollViewRef = useRef<ScrollViewType>(null);
	const providerId = healthcareProvider?.id || "";

	const {
		data: proceduresData,
		isLoading,
		error,
		refetch,
	} = useProceduresByProvider({
		healthcareProviderId: providerId,
		enabled: !!providerId,
	});

	const createProcedureMutation = useCreateProcedure();
	const updateProcedureMutation = useUpdateProcedure();
	const deleteProcedureMutation = useDeleteProcedure();

	const defaultValues = useMemo(
		(): ProceduresFormData => ({
			procedures:
				proceduresData?.procedures.map((procedure) => ({
					id: procedure.id,
					name: procedure.name,
					description: procedure.description,
					priceInCents: procedure.priceInCents,
					durationInMinutes: procedure.durationInMinutes,
				})) || [],
		}),
		[proceduresData],
	);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<ProceduresFormData>({
		defaultValues,
	});

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const validateProcedure = (procedure: ProcedureData): boolean => {
		if (procedure._isDeleted) {
			return true;
		}

		if (!procedure.name.trim()) {
			Alert.alert(t("common.validationError"), t("common.procedureNameIsRequired"));
			return false;
		}

		if (procedure.priceInCents < 0) {
			Alert.alert(t("common.validationError"), t("common.priceMustBe0OrGreater"));
			return false;
		}

		if (procedure.durationInMinutes < 1) {
			Alert.alert(t("common.validationError"), t("common.durationMustBeAtLeast1Minute"));
			return false;
		}

		return true;
	};

	const onSubmit = async (data: ProceduresFormData) => {
		if (!providerId) {
			return;
		}

		const parsed = proceduresFormSchema.safeParse(data);

		if (!parsed.success) {
			Alert.alert(t("common.validationError"), t("common.pleaseReviewTheAppointment"));
			return;
		}

		for (const procedure of parsed.data.procedures) {
			if (!validateProcedure(procedure)) {
				return;
			}
		}

		setIsSaving(true);

		try {
			const operations: Promise<unknown>[] = [];

			for (const procedure of parsed.data.procedures) {
				if (procedure._isDeleted && procedure.id) {
					operations.push(deleteProcedureMutation.mutateAsync(procedure.id));
				} else if (procedure._isNew) {
					operations.push(
						createProcedureMutation.mutateAsync({
							name: procedure.name.trim(),
							description: procedure.description?.trim() || null,
							priceInCents: procedure.priceInCents,
							durationInMinutes: procedure.durationInMinutes,
							healthcareProviderId: providerId,
						}),
					);
				} else if (procedure.id) {
					const originalProcedure = defaultValues.procedures.find(
						(item) => item.id === procedure.id,
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
									name: procedure.name.trim(),
									description: procedure.description?.trim() || null,
									priceInCents: procedure.priceInCents,
									durationInMinutes: procedure.durationInMinutes,
								},
							}),
						);
					}
				}
			}

			await Promise.all(operations);
			await refetch();
			setEditingProcedureIndex(null);
			setPriceInputValues(new Map());
			Alert.alert(t("common.success"), t("common.proceduresSavedSuccessfully"));
		} catch (procedureError) {
			console.error("Failed to save procedures:", procedureError);
			Alert.alert(t("common.error"), t("common.failedToSaveProfilePleaseTryAgain"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView
			edges={["top"]}
			style={styles.container}
			testID="provider-procedures-screen"
		>
			<ScrollView
				ref={scrollViewRef}
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.editHeader}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("common.goBack")}
						testID="provider-procedures-back-button"
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<ArrowLeft
							size={20}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
					</Pressable>
					<View style={styles.editHeaderCopy}>
						<Text style={styles.editHeaderTitle}>{t("common.procedures")}</Text>
						<Text style={styles.editHeaderSubtitle}>
							{t("common.manageProceduresDescription")}
						</Text>
					</View>
				</View>

				{isLoading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>{t("common.loadingProcedures")}</Text>
					</View>
				) : error ? (
					<View style={styles.errorContainer}>
						<AlertCircle
							size={48}
							color={theme.colors.destructive}
							strokeWidth={2}
						/>
						<Text style={styles.errorText}>{t("common.failedToLoadProfile")}</Text>
						<Button onPress={() => refetch()} size="sm">
							{t("common.retry")}
						</Button>
					</View>
				) : (
					<Controller
						control={control}
						name="procedures"
						render={({ field }) => {
							const procedures = field.value;
							const visibleProcedures = procedures.filter(
								(procedure) => !procedure._isDeleted,
							);

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
								setTimeout(() => {
									scrollViewRef.current?.scrollTo({ y: 0, animated: true });
								}, 100);
							};

							const removeProcedure = (index: number) => {
								const procedure = procedures[index];
								if (procedure.id) {
									const updated = [...procedures];
									updated[index] = { ...procedure, _isDeleted: true };
									field.onChange(updated);
								} else {
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
										<Text style={styles.sectionTitle}>{t("common.procedures")}</Text>
										<Button variant="outline" size="sm" onPress={addProcedure}>
											<View style={styles.buttonContent}>
												<Plus
													size={16}
													color={theme.colors.foreground}
													strokeWidth={2}
												/>
												<Text style={styles.buttonText}>{t("common.addProcedure")}</Text>
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
											<Text style={styles.emptyText}>{t("common.noProceduresYet")}</Text>
											<Text style={styles.emptySubtext}>
												{t("common.addProceduresToLetPatientsKnowWhatServicesYouOffer")}
											</Text>
										</View>
									) : (
										<View style={styles.proceduresList}>
											{visibleProcedures.map((procedure) => {
												const actualIndex = procedures.findIndex(
													(item) => item === procedure,
												);
												const isEditing = editingProcedureIndex === actualIndex;

												return (
													<View key={actualIndex} style={styles.procedureCard}>
														{isEditing ? (
															<View style={styles.procedureEditForm}>
																<View style={styles.fieldGroup}>
																	<Text style={styles.fieldLabel}>
																		{t("common.name")} <Text style={styles.required}>*</Text>
																	</Text>
																	<Input
																		value={procedure.name}
																		onChangeText={(text) =>
																			updateProcedureField(actualIndex, "name", text)
																		}
																		placeholder={t("common.eGConsultation")}
																	/>
																</View>

																<View style={styles.fieldGroup}>
																	<Text style={styles.fieldLabel}>{t("common.description")}</Text>
																	<Input
																		value={procedure.description || ""}
																		onChangeText={(text) =>
																			updateProcedureField(
																				actualIndex,
																				"description",
																				text || null,
																			)
																		}
																		placeholder={t("common.describeTheProcedure")}
																		multiline
																	/>
																</View>

																<View style={styles.fieldRow}>
																	<View style={styles.fieldGroupHalf}>
																		<Text style={styles.fieldLabel}>
																			{t("common.durationMinutes")}{" "}
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
																					value ? Number.parseInt(value, 10) : 0,
																				);
																			}}
																			placeholder="30"
																			keyboardType="number-pad"
																		/>
																	</View>

																	<View style={styles.fieldGroupHalf}>
																		<Text style={styles.fieldLabel}>
																			{t("common.priceBRL")}{" "}
																			<Text style={styles.required}>*</Text>
																		</Text>
																		<Input
																			leftIcon={DollarSign}
																			value={
																				priceInputValues.has(actualIndex)
																					? priceInputValues.get(actualIndex)
																					: procedure.priceInCents === 0
																						? ""
																						: (procedure.priceInCents / 100).toFixed(2)
																			}
																			onChangeText={(text) => {
																				const cleaned = text.replace(/[^0-9.]/g, "");
																				const parts = cleaned.split(".");
																				const formatted =
																					parts.length > 2
																						? `${parts[0]}.${parts.slice(1).join("")}`
																						: cleaned;

																				setPriceInputValues((prev) => {
																					const next = new Map(prev);
																					next.set(actualIndex, formatted);
																					return next;
																				});
																				updateProcedureField(
																					actualIndex,
																					"priceInCents",
																					Math.round((parseFloat(formatted) || 0) * 100),
																				);
																			}}
																			onBlur={() => {
																				const currentValue =
																					priceInputValues.get(actualIndex) || "";
																				const parsedValue = parseFloat(currentValue) || 0;
																				const formatted = parsedValue.toFixed(2);
																				setPriceInputValues((prev) => {
																					const next = new Map(prev);
																					next.set(actualIndex, formatted);
																					return next;
																				});
																				updateProcedureField(
																					actualIndex,
																					"priceInCents",
																					Math.round(parsedValue * 100),
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
																		<Text style={styles.buttonText}>{t("common.done")}</Text>
																	</Button>
																	<Button
																		variant="destructive"
																		size="sm"
																		onPress={() => {
																			Alert.alert(
																				t("common.deleteProcedure"),
																				t("common.areYouSureYouWantToDeleteThisProcedure"),
																				[
																					{ text: t("common.cancel"), style: "cancel" },
																					{
																						text: t("common.delete"),
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

																{procedure.description ? (
																	<Text style={styles.procedureDescription}>
																		{procedure.description}
																	</Text>
																) : null}

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
				)}
			</ScrollView>

			{isDirty && !isLoading ? (
				<View style={styles.stickyButtonContainer}>
					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={isSaving}
						loading={isSaving}
						style={styles.saveButton}
					>
						<View style={styles.buttonContent}>
							{isSaving ? (
								<ActivityIndicator
									size="small"
									color={theme.colors.primaryForeground}
								/>
							) : (
								<Save size={20} color={theme.colors.primaryForeground} />
							)}
							<Text style={styles.saveButtonText}>{t("common.saveChanges")}</Text>
						</View>
					</Button>
				</View>
			) : null}
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
	procedureEditForm: {
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
