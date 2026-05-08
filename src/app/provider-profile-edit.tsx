import { useEffect, useState } from "react";
import {
	AlertCircle,
	Briefcase,
	CreditCard,
	FileText,
	GraduationCap,
	Image as ImageIcon,
	Languages,
	MapPin,
	Plus,
	Save,
	ShieldCheck,
	Trash2,
	Upload,
	type LucideIcon,
	User,
	X,
} from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	Text,
	View,
} from "react-native";
import { Controller, type Control, useFieldArray, useForm } from "react-hook-form";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import {
	SERVICE_MODALITY_VALUES,
	serviceModalityOptions,
} from "@/constants/service-modalities";
import { useAuth } from "@/contexts/auth";
import {
	useDeleteClinicPhoto,
	useDeleteLicenseDocument,
	useUpdateHealthcareProvider,
	useUploadClinicPhoto,
	useUploadLicenseDocument,
} from "@/hooks/use-procedures";

const profileFormSchema = z.object({
	displayName: z.string().nullable(),
	document: z.string().nullable(),
	birthDate: z.string().nullable(),
	gender: z.string().nullable(),
	languages: z.string().nullable(),
	specialty: z.string(),
	professionalCategory: z.string().nullable(),
	professionalId: z.string().nullable(),
	licenseCouncil: z.string().nullable(),
	licenseState: z.string().nullable(),
	bio: z.string().nullable(),
	approach: z.string().nullable(),
	education: z.string().nullable(),
	certifications: z.string().nullable(),
	yearsOfExperience: z.string().nullable(),
	targetAudiences: z.string().nullable(),
	serviceModalities: z
		.array(z.enum(SERVICE_MODALITY_VALUES)),
	clinicAddress: z.string().nullable(),
	homeCareRadiusKm: z.string().nullable(),
	acceptedInsurance: z.string().nullable(),
	paymentMethods: z.string().nullable(),
	cancellationPolicy: z.string().nullable(),
	termsAccepted: z.boolean(),
	lgpdConsent: z.boolean(),
	professionalResponsibilityAccepted: z.boolean(),
	faqs: z.array(
		z.object({
			question: z.string(),
			answer: z.string(),
		}),
	),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type ProfileTextField = Exclude<
	keyof ProfileFormData,
	| "termsAccepted"
	| "lgpdConsent"
	| "professionalResponsibilityAccepted"
	| "serviceModalities"
	| "faqs"
>;

const emptyProfileForm: ProfileFormData = {
	displayName: null,
	document: null,
	birthDate: null,
	gender: null,
	languages: null,
	specialty: "",
	professionalCategory: null,
	professionalId: null,
	licenseCouncil: null,
	licenseState: null,
	bio: null,
	approach: null,
	education: null,
	certifications: null,
	yearsOfExperience: null,
	targetAudiences: null,
	serviceModalities: [],
	clinicAddress: null,
	homeCareRadiusKm: null,
	acceptedInsurance: null,
	paymentMethods: null,
	cancellationPolicy: null,
	termsAccepted: false,
	lgpdConsent: false,
	professionalResponsibilityAccepted: false,
	faqs: [],
};

function joinList(value?: string[] | null) {
	return value?.join(", ") || null;
}

function splitList(value?: string | null) {
	return (
		value
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) || []
	);
}

function toAcceptanceDate(accepted: boolean, currentValue?: string | null) {
	if (!accepted) return null;
	return currentValue || new Date().toISOString();
}

export default function ProviderProfileEdit() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { healthcareProvider } = useAuth();
	const [isSaving, setIsSaving] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [hasLicenseDocument, setHasLicenseDocument] = useState(false);
	const updateProviderMutation = useUpdateHealthcareProvider();
	const uploadLicenseDocumentMutation = useUploadLicenseDocument();
	const deleteLicenseDocumentMutation = useDeleteLicenseDocument();
	const uploadClinicPhotoMutation = useUploadClinicPhoto();
	const deleteClinicPhotoMutation = useDeleteClinicPhoto();

	const {
		control,
		handleSubmit,
		reset,
		formState: { isDirty },
	} = useForm<ProfileFormData>({
		defaultValues: emptyProfileForm,
	});
	const { fields: faqFields, append: appendFaq, remove: removeFaq } =
		useFieldArray({
			control,
			name: "faqs",
		});
	const onboardingSteps = [
		t("common.basicRegistration"),
		t("common.professionalVerification"),
		t("common.publicProfile"),
		t("common.attendanceAndOperation"),
		t("common.complianceAndTerms"),
	];
	const isLastStep = currentStep === onboardingSteps.length - 1;

	useEffect(() => {
		setHasLicenseDocument(Boolean(healthcareProvider?.licenseDocumentFileName));
		reset({
			displayName: healthcareProvider?.displayName || null,
			document: healthcareProvider?.document || null,
			birthDate: healthcareProvider?.birthDate?.slice(0, 10) || null,
			gender: healthcareProvider?.gender || null,
			languages: joinList(healthcareProvider?.languages),
			specialty: healthcareProvider?.specialty || "",
			professionalCategory: healthcareProvider?.professionalCategory || null,
			professionalId: healthcareProvider?.professionalId || null,
			licenseCouncil: healthcareProvider?.licenseCouncil || null,
			licenseState: healthcareProvider?.licenseState || null,
			bio: healthcareProvider?.bio || null,
			approach: healthcareProvider?.approach || null,
			education: healthcareProvider?.education || null,
			certifications: healthcareProvider?.certifications || null,
			yearsOfExperience:
				healthcareProvider?.yearsOfExperience?.toString() || null,
			targetAudiences: joinList(healthcareProvider?.targetAudiences),
			serviceModalities: healthcareProvider?.serviceModalities || [],
			clinicAddress: healthcareProvider?.clinicAddress || null,
			homeCareRadiusKm: healthcareProvider?.homeCareRadiusKm?.toString() || null,
			acceptedInsurance: joinList(healthcareProvider?.acceptedInsurance),
			paymentMethods: joinList(healthcareProvider?.paymentMethods),
			cancellationPolicy: healthcareProvider?.cancellationPolicy || null,
			termsAccepted: Boolean(healthcareProvider?.termsAcceptedAt),
			lgpdConsent: Boolean(healthcareProvider?.lgpdConsentAt),
			professionalResponsibilityAccepted: Boolean(
				healthcareProvider?.professionalResponsibilityAcceptedAt,
			),
			faqs:
				healthcareProvider?.faqs?.map((faq) => ({
					question: faq.question,
					answer: faq.answer,
				})) || [],
		});
	}, [healthcareProvider, reset]);

	const onSubmit = async (data: ProfileFormData) => {
		const parsed = profileFormSchema.safeParse(data);

		if (!parsed.success) {
			Alert.alert(
				t("common.validationError"),
				t("common.pleaseReviewThePatientInformation"),
			);
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
					displayName: parsed.data.displayName?.trim() || null,
					document: parsed.data.document?.trim() || null,
					birthDate: parsed.data.birthDate?.trim() || null,
					gender: parsed.data.gender?.trim() || null,
					languages: splitList(parsed.data.languages),
					specialty: parsed.data.specialty.trim(),
					professionalCategory:
						parsed.data.professionalCategory?.trim() || null,
					professionalId: parsed.data.professionalId?.trim() || null,
					licenseCouncil: parsed.data.licenseCouncil?.trim() || null,
					licenseState: parsed.data.licenseState?.trim() || null,
					bio: parsed.data.bio?.trim() || null,
					approach: parsed.data.approach?.trim() || null,
					education: parsed.data.education?.trim() || null,
					certifications: parsed.data.certifications?.trim() || null,
					yearsOfExperience: parsed.data.yearsOfExperience?.trim()
						? Number(parsed.data.yearsOfExperience)
						: null,
					targetAudiences: splitList(parsed.data.targetAudiences),
					serviceModalities: parsed.data.serviceModalities,
					clinicAddress: parsed.data.clinicAddress?.trim() || null,
					homeCareRadiusKm: parsed.data.homeCareRadiusKm?.trim()
						? Number(parsed.data.homeCareRadiusKm)
						: null,
					acceptedInsurance: splitList(parsed.data.acceptedInsurance),
					paymentMethods: splitList(parsed.data.paymentMethods),
					cancellationPolicy:
						parsed.data.cancellationPolicy?.trim() || null,
					termsAcceptedAt: toAcceptanceDate(
						parsed.data.termsAccepted,
						healthcareProvider.termsAcceptedAt,
					),
					lgpdConsentAt: toAcceptanceDate(
						parsed.data.lgpdConsent,
						healthcareProvider.lgpdConsentAt,
					),
					professionalResponsibilityAcceptedAt: toAcceptanceDate(
						parsed.data.professionalResponsibilityAccepted,
						healthcareProvider.professionalResponsibilityAcceptedAt,
					),
					faqs: parsed.data.faqs
						.map((faq) => ({
							question: faq.question.trim(),
							answer: faq.answer.trim(),
						}))
						.filter((faq) => faq.question && faq.answer),
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

	const handlePickLicenseDocument = async () => {
		if (!healthcareProvider?.id) {
			return;
		}

		const result = await DocumentPicker.getDocumentAsync({
			type: ["application/pdf", "image/png", "image/jpeg"],
			copyToCacheDirectory: true,
			multiple: false,
		});

		if (result.canceled || !result.assets[0]) {
			return;
		}

		const asset = result.assets[0];

		try {
			await uploadLicenseDocumentMutation.mutateAsync({
				providerId: healthcareProvider.id,
				file: {
					uri: asset.uri,
					name: asset.name,
					type: asset.mimeType || "application/octet-stream",
				},
			});
			setHasLicenseDocument(true);
			Alert.alert(t("common.success"), t("common.documentUploadedSecurely"));
		} catch (error) {
			console.error("Failed to upload professional document:", error);
			Alert.alert(t("common.error"), t("common.failedToUploadDocument"));
		}
	};

	const handleDeleteLicenseDocument = async () => {
		if (!healthcareProvider?.id) {
			return;
		}

		try {
			await deleteLicenseDocumentMutation.mutateAsync(healthcareProvider.id);
			setHasLicenseDocument(false);
			Alert.alert(t("common.success"), t("common.documentRemoved"));
		} catch (error) {
			console.error("Failed to delete professional document:", error);
			Alert.alert(t("common.error"), t("common.failedToRemoveDocument"));
		}
	};

	const handlePickClinicPhoto = async () => {
		if (!healthcareProvider?.id) {
			return;
		}

		const permission =
			await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (!permission.granted) {
			Alert.alert(t("common.permissionRequired"), t("common.photoLibraryPermissionRequired"));
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 0.85,
		});

		if (result.canceled || !result.assets[0]) {
			return;
		}

		const asset = result.assets[0];
		const fileName = asset.fileName || `clinic-photo-${Date.now()}.jpg`;

		try {
			await uploadClinicPhotoMutation.mutateAsync({
				providerId: healthcareProvider.id,
				file: {
					uri: asset.uri,
					name: fileName,
					type: asset.mimeType || "image/jpeg",
				},
			});
			Alert.alert(t("common.success"), t("common.clinicPhotoUploaded"));
		} catch (error) {
			console.error("Failed to upload clinic photo:", error);
			Alert.alert(t("common.error"), t("common.failedToUploadClinicPhoto"));
		}
	};

	const handleDeleteClinicPhoto = async (index: number) => {
		if (!healthcareProvider?.id) {
			return;
		}

		try {
			await deleteClinicPhotoMutation.mutateAsync({
				providerId: healthcareProvider.id,
				index,
			});
			Alert.alert(t("common.success"), t("common.clinicPhotoRemoved"));
		} catch (error) {
			console.error("Failed to delete clinic photo:", error);
			Alert.alert(t("common.error"), t("common.failedToRemoveClinicPhoto"));
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
				<ScreenHeader
					title={t("common.professionalProfile")}
					subtitle={t("common.updateSpecialtyBioProfessionalId")}
					icon={User}
					backButtonTestID="provider-profile-edit-back-button"
					style={styles.screenHeader}
				/>
				<StepIndicator steps={onboardingSteps} currentStep={currentStep} />

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

							{currentStep === 0 ? (
								<>
							<View style={styles.card}>
							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>{t("common.name")}</Text>
								<View style={styles.readOnlyField}>
									<User size={16} color={theme.colors.mutedForeground} />
									<Text style={styles.readOnlyText}>
										{healthcareProvider?.name || t("common.notSet")}
									</Text>
								</View>
							</View>

							<View style={styles.fieldGroup}>
								<Text style={styles.fieldLabel}>{t("common.email")}</Text>
								<View style={styles.readOnlyField}>
									<Text style={styles.readOnlyText}>
										{healthcareProvider?.email || t("common.notSet")}
									</Text>
								</View>
								</View>
								</View>
							<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.identification")}
							</Text>
							<FormInput
								control={control}
								icon={User}
								name="displayName"
								label={t("common.displayName")}
								placeholder={t("common.eGDraAnaSouza")}
							/>
							<FormInput
								control={control}
								icon={FileText}
								name="document"
								label={t("common.cpfOrCnpj")}
								placeholder={t("common.internalUseOnly")}
							/>
							<Controller
								control={control}
								name="birthDate"
								render={({ field }) => (
									<View style={styles.fieldGroup}>
										<Text style={styles.fieldLabel}>{t("common.birthDate")}</Text>
										<DatePickerInput
											value={field.value}
											onChange={field.onChange}
											title="common.selectBirthDate"
											placeholder="common.selectBirthDate"
											allowClear
										/>
									</View>
								)}
							/>
							<FormInput
								control={control}
								icon={User}
								name="gender"
								label={t("common.gender")}
								placeholder={t("common.optional")}
							/>
							<FormInput
								control={control}
								icon={Languages}
								name="languages"
								label={t("common.attendanceLanguages")}
								placeholder={t("common.commaSeparatedExamplesLanguages")}
							/>
							</View>

								</>
							) : null}

							{currentStep === 1 ? (
								<>
							<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.professionalVerification")}
							</Text>
							<Text style={styles.documentDescription}>
								{t("common.professionalVerificationCanBeCompletedLater")}
							</Text>
							{healthcareProvider.verificationStatus === "REJECTED" &&
							healthcareProvider.verificationRejectionReason ? (
								<View style={styles.rejectionNotice}>
									<AlertCircle
										size={20}
										color={theme.colors.destructive}
										strokeWidth={2}
									/>
									<View style={styles.rejectionNoticeContent}>
										<Text style={styles.rejectionNoticeTitle}>
											{t("common.verificationRejected")}
										</Text>
										<Text style={styles.rejectionNoticeText}>
											{t("common.verificationRejectionReason")}:{" "}
											{healthcareProvider.verificationRejectionReason}
										</Text>
										<Text style={styles.rejectionNoticeText}>
											{t("common.correctInformationAndUploadAgain")}
										</Text>
									</View>
								</View>
							) : null}
							<FormInput
								control={control}
								icon={Briefcase}
								name="professionalCategory"
								label={`${t("common.professionalCategory")} *`}
								placeholder={t("common.eGHealthcareProfession")}
							/>
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
										<Text style={styles.fieldLabel}>
											{t("common.professionalID")} <Text style={styles.required}>*</Text>
										</Text>
										<Input
											leftIcon={FileText}
											value={field.value || ""}
											onChangeText={field.onChange}
											placeholder={t("common.eGCRM12345")}
										/>
									</View>
								)}
							/>
							<FormInput
								control={control}
								icon={ShieldCheck}
								name="licenseCouncil"
								label={`${t("common.professionalCouncil")} *`}
								placeholder={t("common.eGCRMCRPCRN")}
							/>
							<FormInput
								control={control}
								icon={MapPin}
								name="licenseState"
								label={`${t("common.registrationState")} *`}
								placeholder="SP"
							/>
							<View style={styles.documentBox}>
								<View style={styles.documentInfo}>
									<FileText
										size={20}
										color={theme.colors.primary}
										strokeWidth={2}
									/>
									<View style={styles.documentTextContainer}>
										<Text style={styles.documentTitle}>
											{t("common.professionalCouncilDocument")}
										</Text>
										<Text style={styles.documentDescription}>
											{t("common.documentStoredPrivately")}
										</Text>
										{healthcareProvider.licenseDocumentFileName ? (
											<Text style={styles.documentFileName} numberOfLines={1}>
												{healthcareProvider.licenseDocumentFileName}
											</Text>
										) : null}
									</View>
								</View>
								<View style={styles.documentActions}>
									<Button
										onPress={handlePickLicenseDocument}
										disabled={uploadLicenseDocumentMutation.isPending}
										loading={uploadLicenseDocumentMutation.isPending}
										style={styles.documentButton}
									>
										<View style={styles.buttonContent}>
											<Upload
												size={18}
												color={theme.colors.primaryForeground}
											/>
											<Text style={styles.saveButtonText}>
												{t("common.upload")}
											</Text>
										</View>
									</Button>
									{healthcareProvider.licenseDocumentFileName ? (
										<Button
											onPress={handleDeleteLicenseDocument}
											disabled={deleteLicenseDocumentMutation.isPending}
											loading={deleteLicenseDocumentMutation.isPending}
											style={styles.documentDangerButton}
										>
											<View style={styles.buttonContent}>
												<Trash2
													size={18}
													color={theme.colors.primaryForeground}
												/>
												<Text style={styles.saveButtonText}>
													{t("common.delete")}
												</Text>
											</View>
										</Button>
									) : null}
								</View>
							</View>
						</View>
								</>
							) : null}

							{currentStep === 2 ? (
								<>
							<View style={styles.card}>
								<Text style={styles.sectionSubtitle}>
									{t("common.publicProfile")}
								</Text>
							<FormInput
								control={control}
								icon={Briefcase}
								name="yearsOfExperience"
								label={t("common.yearsOfExperience")}
								placeholder="8"
								keyboardType="numeric"
							/>
							<FormInput
								control={control}
								icon={User}
								name="targetAudiences"
								label={t("common.targetAudiences")}
								placeholder={t("common.commaSeparatedExamplesAudiences")}
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
							<FormInput
								control={control}
								icon={FileText}
								name="approach"
								label={t("common.approach")}
								placeholder={t("common.describeYourApproach")}
								multiline
							/>
							<FormInput
								control={control}
								icon={GraduationCap}
								name="education"
								label={t("common.education")}
								placeholder={t("common.describeYourEducation")}
								multiline
							/>
							<FormInput
								control={control}
								icon={GraduationCap}
								name="certifications"
								label={t("common.certifications")}
								placeholder={t("common.describeYourCertifications")}
								multiline
							/>
						</View>

						<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.clinicPhotos")}
							</Text>
							<View style={styles.documentBox}>
								<View style={styles.documentInfo}>
									<ImageIcon size={22} color={theme.colors.primary} />
									<View style={styles.documentTextContainer}>
										<Text style={styles.documentTitle}>
											{t("common.careEnvironment")}
										</Text>
										<Text style={styles.documentDescription}>
											{t("common.clinicPhotosDescription")}
										</Text>
									</View>
								</View>
								<Button
									variant="outline"
									onPress={handlePickClinicPhoto}
									disabled={
										uploadClinicPhotoMutation.isPending ||
										(healthcareProvider.clinicPhotos?.length || 0) >= 8
									}
									loading={uploadClinicPhotoMutation.isPending}
									style={styles.documentButton}
								>
									<View style={styles.buttonContent}>
										<Upload size={18} color={theme.colors.foreground} />
										<Text style={styles.outlineButtonText}>
											{t("common.uploadPhoto")}
										</Text>
									</View>
								</Button>
							</View>

							{healthcareProvider.clinicPhotos?.length ? (
								<View style={styles.clinicPhotosGrid}>
									{healthcareProvider.clinicPhotos.map((photo, index) => (
										<View key={`${photo}-${index}`} style={styles.clinicPhotoCard}>
											<Image source={{ uri: photo }} style={styles.clinicPhoto} />
											<Button
												variant="destructive"
												size="sm"
												onPress={() => handleDeleteClinicPhoto(index)}
												disabled={deleteClinicPhotoMutation.isPending}
												style={styles.clinicPhotoDeleteButton}
											>
												<Trash2
													size={16}
													color={theme.colors.primaryForeground}
												/>
											</Button>
										</View>
									))}
								</View>
							) : (
								<Text style={styles.emptyFaqText}>
									{t("common.noClinicPhotosYet")}
								</Text>
							)}
						</View>

						<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.frequentlyAskedQuestions")}
							</Text>
							{faqFields.length === 0 ? (
								<Text style={styles.emptyFaqText}>
									{t("common.addFaqsToAnswerCommonQuestions")}
								</Text>
							) : null}
							{faqFields.map((field, index) => (
								<View key={field.id} style={styles.faqCard}>
									<View style={styles.faqHeader}>
										<Text style={styles.faqTitle}>
											{t("common.questionCount", { count: index + 1 })}
										</Text>
										<Button
											variant="ghost"
											size="sm"
											onPress={() => removeFaq(index)}
											style={styles.faqRemoveButton}
										>
											<X size={18} color={theme.colors.foreground} />
										</Button>
									</View>
									<Controller
										control={control}
										name={`faqs.${index}.question`}
										render={({ field }) => (
											<View style={styles.fieldGroup}>
												<Text style={styles.fieldLabel}>
													{t("common.question")}
												</Text>
												<Input
													value={field.value || ""}
													onChangeText={field.onChange}
													placeholder={t("common.faqQuestionPlaceholder")}
												/>
											</View>
										)}
									/>
									<Controller
										control={control}
										name={`faqs.${index}.answer`}
										render={({ field }) => (
											<View style={styles.fieldGroup}>
												<Text style={styles.fieldLabel}>
													{t("common.answer")}
												</Text>
												<Input
													value={field.value || ""}
													onChangeText={field.onChange}
													placeholder={t("common.faqAnswerPlaceholder")}
													multiline
												/>
											</View>
										)}
									/>
								</View>
							))}
							<Button
								variant="outline"
								onPress={() => appendFaq({ question: "", answer: "" })}
								disabled={faqFields.length >= 20}
							>
								<View style={styles.buttonContent}>
									<Plus size={18} color={theme.colors.foreground} />
									<Text style={styles.outlineButtonText}>
										{t("common.addQuestion")}
									</Text>
								</View>
								</Button>
							</View>
								</>
							) : null}

							{currentStep === 3 ? (
							<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.attendanceAndOperation")}
							</Text>
							<Controller
								control={control}
								name="serviceModalities"
								render={({ field: { value, onChange } }) => (
									<View style={styles.fieldGroup}>
										<Text style={styles.fieldLabel}>
											{t("common.serviceModalities")}
										</Text>
										<View style={styles.checkboxList}>
											{serviceModalityOptions.map((option) => {
												const checked = value.includes(option.value);

												return (
													<View
														key={option.value}
														style={styles.checkboxOption}
													>
														<Checkbox
															checked={checked}
															onCheckedChange={(nextChecked) => {
																onChange(
																	nextChecked
																		? [...value, option.value]
																		: value.filter(
																				(item) => item !== option.value,
																			),
																);
															}}
														/>
														<View style={styles.checkboxTextContent}>
															<Text style={styles.checkboxTitle}>
																{t(option.labelKey)}
															</Text>
															<Text style={styles.checkboxDescription}>
																{t(option.descriptionKey)}
															</Text>
														</View>
													</View>
												);
											})}
										</View>
									</View>
								)}
							/>
							<FormInput
								control={control}
								icon={MapPin}
								name="clinicAddress"
								label={t("common.clinicAddress")}
								placeholder={t("common.addressShownToPatients")}
							/>
							<FormInput
								control={control}
								icon={MapPin}
								name="homeCareRadiusKm"
								label={t("common.homeCareRadiusKm")}
								placeholder="10"
								keyboardType="numeric"
							/>
							<FormInput
								control={control}
								icon={ShieldCheck}
								name="acceptedInsurance"
								label={t("common.acceptedInsurance")}
								placeholder={t("common.commaSeparatedExamplesInsurance")}
							/>
							<FormInput
								control={control}
								icon={CreditCard}
								name="paymentMethods"
								label={t("common.paymentMethods")}
								placeholder={t("common.commaSeparatedExamplesPayments")}
							/>
							<FormInput
								control={control}
								icon={FileText}
								name="cancellationPolicy"
								label={t("common.cancellationPolicy")}
								placeholder={t("common.describeCancellationPolicy")}
								multiline
								/>
							</View>
							) : null}

							{currentStep === 4 ? (
							<View style={styles.card}>
							<Text style={styles.sectionSubtitle}>
								{t("common.complianceAndTerms")}
							</Text>
							<ComplianceCheckbox
								control={control}
								name="termsAccepted"
								title={t("common.platformTerms")}
								description={t("common.platformTermsDescription")}
							/>
							<ComplianceCheckbox
								control={control}
								name="lgpdConsent"
								title={t("common.lgpdConsent")}
								description={t("common.lgpdConsentDescription")}
							/>
							<ComplianceCheckbox
								control={control}
								name="professionalResponsibilityAccepted"
								title={t("common.professionalResponsibility")}
								description={t("common.professionalResponsibilityDescription")}
								/>
							</View>
							) : null}
						</View>
					)}
			</ScrollView>

			{healthcareProvider ? (
				<View style={styles.stickyButtonContainer}>
					<Button
						variant="outline"
						onPress={() => setCurrentStep((step) => Math.max(step - 1, 0))}
						disabled={currentStep === 0}
						style={styles.stepNavButton}
					>
						<Text style={styles.outlineButtonText}>{t("common.back")}</Text>
					</Button>
					{isLastStep ? (
					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={isSaving || !isDirty}
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
					) : (
						<Button
							onPress={() =>
								setCurrentStep((step) =>
									Math.min(step + 1, onboardingSteps.length - 1),
								)
							}
							style={styles.stepNavButton}
						>
							<Text style={styles.saveButtonText}>{t("common.continue")}</Text>
						</Button>
					)}
				</View>
			) : null}
		</SafeAreaView>
	);
}

function ComplianceCheckbox({
	control,
	name,
	title,
	description,
}: {
	control: Control<ProfileFormData>;
	name:
		| "termsAccepted"
		| "lgpdConsent"
		| "professionalResponsibilityAccepted";
	title: string;
	description: string;
}) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<View style={styles.complianceRow}>
					<Checkbox
						checked={Boolean(field.value)}
						onCheckedChange={field.onChange}
					/>
					<View style={styles.complianceTextContainer}>
						<Text style={styles.complianceTitle}>{title}</Text>
						<Text style={styles.complianceDescription}>{description}</Text>
					</View>
				</View>
			)}
		/>
	);
}

function StepIndicator({
	currentStep,
	steps,
}: {
	currentStep: number;
	steps: string[];
}) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.stepIndicatorList}
		>
			{steps.map((step, index) => (
				<View
					key={step}
					style={[
						styles.stepIndicatorItem,
						index === currentStep && styles.stepIndicatorItemActive,
						index < currentStep && styles.stepIndicatorItemCompleted,
					]}
				>
					<Text
						style={[
							styles.stepIndicatorMeta,
							index === currentStep && styles.stepIndicatorTextActive,
						]}
					>
						{index + 1}
					</Text>
					<Text
						style={[
							styles.stepIndicatorText,
							index === currentStep && styles.stepIndicatorTextActive,
						]}
					>
						{step}
					</Text>
				</View>
			))}
		</ScrollView>
	);
}

function FormInput({
	control,
	icon,
	label,
	name,
	placeholder,
	multiline,
	keyboardType,
}: {
	control: Control<ProfileFormData>;
	icon?: LucideIcon;
	label: string;
	name: ProfileTextField;
	placeholder?: string;
	multiline?: boolean;
	keyboardType?: "default" | "numeric";
}) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<View style={styles.fieldGroup}>
					<Text style={styles.fieldLabel}>{label}</Text>
					<Input
						leftIcon={icon}
						value={field.value || ""}
						onChangeText={field.onChange}
						placeholder={placeholder}
						multiline={multiline}
						keyboardType={keyboardType}
					/>
				</View>
			)}
		/>
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
	screenHeader: {
		marginBottom: theme.gap(2),
	},
	stepIndicatorList: {
		gap: theme.gap(1),
		paddingBottom: theme.gap(2),
	},
	stepIndicatorItem: {
		minWidth: 132,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.secondary,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1),
	},
	stepIndicatorItemActive: {
		borderColor: theme.colors.primary,
		backgroundColor: `${theme.colors.primary}14`,
	},
	stepIndicatorItemCompleted: {
		borderColor: `${theme.colors.primary}66`,
	},
	stepIndicatorMeta: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.mutedForeground,
	},
	stepIndicatorText: {
		marginTop: theme.gap(0.25),
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.secondaryForeground,
	},
	stepIndicatorTextActive: {
		color: theme.colors.primary,
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
	sectionSubtitle: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
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
	checkboxList: {
		gap: theme.gap(1.25),
	},
	checkboxOption: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(1.5),
		padding: theme.gap(1.75),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.background,
	},
	checkboxTextContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	checkboxTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	checkboxDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 17,
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
	documentBox: {
		gap: theme.gap(2),
		padding: theme.gap(2.5),
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	documentInfo: {
		flexDirection: "row",
		gap: theme.gap(2),
	},
	documentTextContainer: {
		flex: 1,
		minWidth: 0,
	},
	documentTitle: {
		fontSize: 15,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	documentDescription: {
		marginTop: theme.gap(0.5),
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	documentFileName: {
		marginTop: theme.gap(1),
		fontSize: 13,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	rejectionNotice: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		padding: theme.gap(2),
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: `${theme.colors.destructive}33`,
		backgroundColor: `${theme.colors.destructive}10`,
	},
	rejectionNoticeContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	rejectionNoticeTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.destructive,
	},
	rejectionNoticeText: {
		fontSize: 13,
		color: theme.colors.foreground,
		lineHeight: 18,
	},
	documentActions: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		flexWrap: "wrap",
	},
	documentButton: {
		flex: 1,
		minWidth: 120,
	},
	documentDangerButton: {
		flex: 1,
		minWidth: 120,
		backgroundColor: theme.colors.destructive,
	},
	clinicPhotosGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1.5),
	},
	clinicPhotoCard: {
		position: "relative",
		width: "47%",
		aspectRatio: 4 / 3,
		overflow: "hidden",
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.muted,
	},
	clinicPhoto: {
		width: "100%",
		height: "100%",
	},
	clinicPhotoDeleteButton: {
		position: "absolute",
		top: theme.gap(1),
		right: theme.gap(1),
		width: 36,
		height: 36,
		backgroundColor: theme.colors.destructive,
	},
	emptyFaqText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		padding: theme.gap(2),
		borderWidth: 1,
		borderStyle: "dashed",
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	faqCard: {
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	faqHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	faqTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	faqRemoveButton: {
		width: 40,
	},
	outlineButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	complianceRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	complianceTextContainer: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	complianceTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	complianceDescription: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	stickyButtonContainer: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: "row",
		gap: theme.gap(1.25),
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
		flex: 1,
		borderRadius: theme.radius.lg,
	},
	stepNavButton: {
		flex: 1,
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
