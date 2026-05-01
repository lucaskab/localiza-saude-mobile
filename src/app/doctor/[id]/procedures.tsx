import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useHealthcareProvider } from "@/hooks/use-healthcare-providers";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import type { Procedure } from "@/types/healthcare-provider";

interface ProceduresFormData {
	selectedProcedures: string[];
}

export default function SelectProcedures() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();

	// Setup React Hook Form
	const { control, watch, handleSubmit } = useForm<ProceduresFormData>({
		defaultValues: {
			selectedProcedures: [],
		},
	});

	// Watch selected procedures for real-time calculations
	const selectedProcedures = watch("selectedProcedures");

	// Fetch provider data from API
	const {
		data: providerData,
		isLoading: providerLoading,
		error: providerError,
	} = useHealthcareProvider(id);

	// Fetch procedures from API
	const {
		data: proceduresData,
		isLoading: proceduresLoading,
		error: proceduresError,
	} = useProceduresByProvider({
		healthcareProviderId: id,
	});

	const isLoading = providerLoading || proceduresLoading;
	const error = providerError || proceduresError;

	// Loading state
	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingText}>{t("common.loadingProcedures")}</Text>
			</View>
		);
	}

	// Error state
	if (error || !providerData?.healthcareProvider) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorText}>
					{t("common.failedToLoadProviderInformation")}
				</Text>
				<Button onPress={() => router.back()} style={styles.errorButton}>
					{t("common.goBack")}
				</Button>
			</View>
		);
	}

	const provider = providerData.healthcareProvider;
	const procedures = proceduresData?.procedures || provider.procedures || [];

	const getSelectedProceduresData = (): Procedure[] => {
		return procedures.filter((p) => selectedProcedures.includes(p.id));
	};

	// Calculate total duration and price (convert cents to dollars)
	const totalDuration = getSelectedProceduresData().reduce(
		(sum, p) => sum + p.durationInMinutes,
		0,
	);
	const totalPrice = getSelectedProceduresData().reduce(
		(sum, p) => sum + p.priceInCents / 100,
		0,
	);

	const onSubmit = (data: ProceduresFormData) => {
		if (data.selectedProcedures.length === 0) return;

		const proceduresParam = data.selectedProcedures.join(",");
		router.push(`/doctor/${id}/booking?procedures=${proceduresParam}`);
	};

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
				<Text style={styles.headerTitle}>{t("common.selectProcedures")}</Text>
				<View style={styles.headerSpacer} />
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingBottom:
							insets.bottom + (selectedProcedures.length > 0 ? 200 : 100),
					},
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
							{provider.specialty || t("common.healthcareProvider")}
						</Text>
					</View>
				</View>

				{/* Procedures List */}
				<View style={styles.proceduresSection}>
					<Text style={styles.sectionTitle}>{t("common.availableProcedures")}</Text>
					{procedures.length === 0 ? (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>
								{t("common.noProceduresAvailableForThisProvider")}
							</Text>
						</View>
					) : (
						<Controller
							control={control}
							name="selectedProcedures"
							render={({ field: { value, onChange } }) => (
								<View style={styles.proceduresList}>
									{procedures.map((procedure) => {
										const isSelected = value.includes(procedure.id);

										const toggleProcedure = () => {
											if (isSelected) {
												onChange(value.filter((id) => id !== procedure.id));
											} else {
												onChange([...value, procedure.id]);
											}
										};

										return (
											<Pressable
												key={procedure.id}
												onPress={toggleProcedure}
												style={[
													styles.procedureCard,
													isSelected && styles.procedureCardSelected,
												]}
											>
												<View style={styles.procedureContent}>
													<Checkbox
														checked={isSelected}
														onCheckedChange={toggleProcedure}
													/>
													<View style={styles.procedureInfo}>
														<View style={styles.procedureHeader}>
															<Text
																style={styles.procedureName}
																numberOfLines={1}
															>
																{procedure.name}
															</Text>
															<Text style={styles.procedurePrice}>
																${(procedure.priceInCents / 100).toFixed(2)}
															</Text>
														</View>
														<Text
															style={styles.procedureDescription}
															numberOfLines={2}
														>
															{procedure.description ||
																t("common.noDescriptionAvailable")}
														</Text>
														<View style={styles.procedureDuration}>
															<Clock
																size={14}
																color={theme.colors.mutedForeground}
																strokeWidth={2}
															/>
															<Text style={styles.procedureDurationText}>
																{t("common.minutesCount", {
																	count: procedure.durationInMinutes,
																})}
															</Text>
														</View>
													</View>
												</View>
											</Pressable>
										);
									})}
								</View>
							)}
						/>
					)}
				</View>
			</ScrollView>

			{/* Fixed Bottom Section */}
			{selectedProcedures.length > 0 && (
				<View
					style={[
						styles.bottomBar,
						{
							paddingBottom: insets.bottom + 16,
						},
					]}
				>
					<View style={styles.summaryCard}>
						<View style={styles.summaryHeader}>
							<CheckCircle2
								size={20}
								color={theme.colors.primary}
								strokeWidth={2}
							/>
							<Text style={styles.summaryTitle}>
								{t("common.selectedProceduresCount", {
									count: selectedProcedures.length,
								})}
							</Text>
						</View>
						<View style={styles.summaryDetails}>
							<View style={styles.summaryDuration}>
								<Clock
									size={16}
									color={theme.colors.mutedForeground}
									strokeWidth={2}
								/>
								<Text style={styles.summaryDurationText}>
									{t("common.totalMinutesMinutes", {
										minutes: String(totalDuration),
									})}
								</Text>
							</View>
							<Text style={styles.summaryPrice}>${totalPrice.toFixed(2)}</Text>
						</View>
					</View>
					<Button
						style={styles.continueButton}
						onPress={handleSubmit(onSubmit)}
					>
						{t("common.continueToBooking")}
					</Button>
				</View>
			)}
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
	emptyContainer: {
		paddingVertical: theme.gap(6),
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
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
	},
	proceduresSection: {
		marginTop: theme.gap(3),
		paddingHorizontal: theme.gap(3),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	proceduresList: {
		gap: theme.gap(2),
	},
	procedureCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 2,
		borderColor: theme.colors.border,
	},
	procedureCardSelected: {
		backgroundColor: `${theme.colors.primary}0D`,
		borderColor: theme.colors.primary,
	},
	procedureContent: {
		flexDirection: "row",
		gap: theme.gap(2),
	},
	procedureInfo: {
		flex: 1,
		minWidth: 0,
	},
	procedureHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		gap: theme.gap(1),
		marginBottom: theme.gap(0.5),
	},
	procedureName: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
		flex: 1,
	},
	procedurePrice: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	procedureDescription: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
		marginBottom: theme.gap(1),
	},
	procedureDuration: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	procedureDurationText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
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
	summaryCard: {
		backgroundColor: `${theme.colors.primary}1A`,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	summaryHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		marginBottom: theme.gap(1.5),
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	summaryDetails: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	summaryDuration: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	summaryDurationText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	summaryPrice: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.primary,
	},
	continueButton: {
		borderRadius: theme.radius.full,
	},
}));
