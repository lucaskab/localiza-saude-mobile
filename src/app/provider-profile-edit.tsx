import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Briefcase, FileText, Save, User } from "lucide-react-native";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { useUpdateHealthcareProvider } from "@/hooks/use-procedures";

const profileFormSchema = z.object({
	specialty: z.string(),
	professionalId: z.string().nullable(),
	bio: z.string().nullable(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProviderProfileEdit() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const router = useRouter();
	const { healthcareProvider } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const updateProviderMutation = useUpdateHealthcareProvider();

	const defaultValues = useMemo(
		(): ProfileFormData => ({
			specialty: healthcareProvider?.specialty || "",
			professionalId: healthcareProvider?.professionalId || null,
			bio: healthcareProvider?.bio || null,
		}),
		[healthcareProvider],
	);

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<ProfileFormData>({
		defaultValues,
	});

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const onSubmit = async (data: ProfileFormData) => {
		const parsed = profileFormSchema.safeParse(data);

		if (!parsed.success || parsed.data.specialty.trim().length === 0) {
			Alert.alert(t("common.validationError"), t("common.specialtyIsRequired"));
			return;
		}

		if (!healthcareProvider?.id) {
			return;
		}

		setIsSaving(true);

		try {
			await updateProviderMutation.mutateAsync({
				providerId: healthcareProvider.id,
				data: {
					specialty: parsed.data.specialty.trim(),
					professionalId: parsed.data.professionalId?.trim() || null,
					bio: parsed.data.bio?.trim() || null,
				},
			});
			reset(parsed.data);
			Alert.alert(t("common.success"), t("common.profileSavedSuccessfully"));
		} catch (error) {
			console.error("Failed to save profile:", error);
			Alert.alert(t("common.error"), t("common.failedToSaveProfilePleaseTryAgain"));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SafeAreaView
			edges={["top"]}
			style={styles.container}
			testID="provider-profile-edit-screen"
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
						testID="provider-profile-edit-back-button"
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
						<Text style={styles.editHeaderTitle}>
							{t("common.professionalProfile")}
						</Text>
						<Text style={styles.editHeaderSubtitle}>
							{t("common.updateSpecialtyBioProfessionalId")}
						</Text>
					</View>
				</View>

				{!healthcareProvider ? (
					<View style={styles.errorContainer}>
						<AlertCircle
							size={48}
							color={theme.colors.destructive}
							strokeWidth={2}
						/>
						<Text style={styles.errorText}>{t("common.failedToLoadProfile")}</Text>
					</View>
				) : (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.profileInformation")}</Text>

						<View style={styles.card}>
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>{t("common.name")}</Text>
								<View style={styles.readOnlyField}>
									<User size={16} color={theme.colors.mutedForeground} />
									<Text style={styles.readOnlyText}>
										{healthcareProvider.user?.name || t("common.notSet")}
									</Text>
								</View>
							</View>

							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>{t("common.email")}</Text>
								<View style={styles.readOnlyField}>
									<Text style={styles.readOnlyText}>
										{healthcareProvider.user?.email || t("common.notSet")}
									</Text>
								</View>
							</View>
						</View>

						<View style={styles.card}>
							<Controller
								control={control}
								name="specialty"
								render={({ field }) => (
									<View style={styles.fieldGroup}>
										<Text style={styles.fieldLabel}>
											{t("common.specialty")} <Text style={styles.required}>*</Text>
										</Text>
										<Input
											leftIcon={Briefcase}
											value={field.value}
											onChangeText={field.onChange}
											placeholder={t("common.eGCardiologist")}
										/>
									</View>
								)}
							/>

							<Controller
								control={control}
								name="professionalId"
								render={({ field }) => (
									<View style={styles.fieldGroup}>
										<Text style={styles.fieldLabel}>{t("common.professionalID")}</Text>
										<Input
											leftIcon={FileText}
											value={field.value || ""}
											onChangeText={field.onChange}
											placeholder={t("common.eGCRM12345")}
										/>
									</View>
								)}
							/>

							<Controller
								control={control}
								name="bio"
								render={({ field }) => (
									<View style={styles.fieldGroup}>
										<Text style={styles.fieldLabel}>{t("common.bio")}</Text>
										<Input
											value={field.value || ""}
											onChangeText={field.onChange}
											placeholder={t("common.tellPatientsAboutYourself")}
											multiline
										/>
									</View>
								)}
							/>
						</View>
					</View>
				)}
			</ScrollView>

			{isDirty && healthcareProvider ? (
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
		marginBottom: theme.gap(2),
	},
	fieldGroup: {
		gap: theme.gap(1.5),
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
	buttonContent: {
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
