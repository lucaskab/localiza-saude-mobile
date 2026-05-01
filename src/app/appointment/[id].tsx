import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar,
	Clock,
	ClipboardPlus,
	DollarSign,
	Droplets,
	FileText,
	HeartPulse,
	Mail,
	MessageCircle,
	Phone,
	Pill,
	ShieldPlus,
	Stethoscope,
	UserRound,
	Users,
} from "lucide-react-native";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import { useAppointmentMedicalRecord } from "@/hooks/use-medical-record";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { MedicalRecord } from "@/types/medical-record";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import {
	getAppointmentCustomerUserId,
	getAppointmentPatientEmail,
	getAppointmentPatientImage,
	getAppointmentPatientName,
	getAppointmentPatientPhone,
	getAppointmentPatientSubtitle,
} from "@/utils/appointments";

interface StatusAction {
	label: TranslationKey;
	status: AppointmentStatus;
	variant?: "default" | "outline" | "destructive" | "secondary";
}

const formatDate = (isoString: string) =>
	new Date(isoString).toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});

const formatTime = (isoString: string) =>
	new Date(isoString).toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});

const formatShortDate = (isoString: string) =>
	new Date(isoString).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

const formatPrice = (priceInCents: number) => `$${(priceInCents / 100).toFixed(2)}`;

const getStatusConfig = (status: AppointmentStatus) => {
	switch (status) {
		case "SCHEDULED":
			return { label: translationKeys.Scheduled, color: "#3b82f6", bgColor: "#dbeafe" };
		case "CONFIRMED":
			return { label: translationKeys.Confirmed, color: "#16a34a", bgColor: "#dcfce7" };
		case "IN_PROGRESS":
			return { label: translationKeys["In Progress"], color: "#d97706", bgColor: "#fef3c7" };
		case "COMPLETED":
			return { label: translationKeys.Completed, color: "#6b7280", bgColor: "#f3f4f6" };
		case "CANCELLED":
			return { label: translationKeys.Cancelled, color: "#dc2626", bgColor: "#fee2e2" };
		case "NO_SHOW":
			return { label: translationKeys["No Show"], color: "#dc2626", bgColor: "#fee2e2" };
		default:
			return { label: translationKeys.Status, color: "#6b7280", bgColor: "#f3f4f6" };
	}
};

const getProviderStatusActions = (
	status: AppointmentStatus,
): StatusAction[] => {
	switch (status) {
		case "SCHEDULED":
			return [
				{ label: translationKeys.Confirm, status: "CONFIRMED", variant: "default" },
				{ label: translationKeys["Start Visit"], status: "IN_PROGRESS", variant: "outline" },
				{ label: translationKeys["Mark No Show"], status: "NO_SHOW", variant: "outline" },
				{ label: translationKeys.Cancel, status: "CANCELLED", variant: "destructive" },
			];
		case "CONFIRMED":
			return [
				{ label: translationKeys["Start Visit"], status: "IN_PROGRESS", variant: "default" },
				{ label: translationKeys["Mark No Show"], status: "NO_SHOW", variant: "outline" },
				{ label: translationKeys.Cancel, status: "CANCELLED", variant: "destructive" },
			];
		case "IN_PROGRESS":
			return [
				{ label: translationKeys["Complete Visit"], status: "COMPLETED", variant: "default" },
				{ label: translationKeys.Cancel, status: "CANCELLED", variant: "destructive" },
			];
		default:
			return [];
	}
};

function DetailRow({
	icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
	label: string;
	value: string;
}) {
	const { theme } = useUnistyles();
	const Icon = icon;

	return (
		<View style={styles.detailRow}>
			<View style={styles.detailIconWrap}>
				<Icon size={16} color={theme.colors.primary} strokeWidth={2} />
			</View>
			<View style={styles.detailContent}>
				<Text style={styles.detailLabel}>{label}</Text>
				<Text style={styles.detailValue}>{value}</Text>
			</View>
		</View>
	);
}

function MedicalRecordItem({
	label,
	value,
}: {
	label: TranslationKey;
	value?: string | null;
}) {
	const { t } = useTranslation();

	return (
		<View style={styles.medicalRecordItem}>
			<Text style={styles.medicalRecordLabel}>{t(label)}</Text>
			<Text style={styles.medicalRecordValue}>
				{value?.trim() || t("common.notInformed")}
			</Text>
		</View>
	);
}

function getMedicalRecordFields(record: MedicalRecord | null | undefined) {
	return [
		{ label: translationKeys["Blood type"], value: record?.bloodType },
		{ label: translationKeys.Medications, value: record?.medications },
		{ label: translationKeys["Chronic Pain"], value: record?.chronicPain },
		{
			label: translationKeys["Pre-existing Conditions"],
			value: record?.preExistingConditions,
		},
		{ label: translationKeys.Allergies, value: record?.allergies },
		{ label: translationKeys.Surgeries, value: record?.surgeries },
		{ label: translationKeys["Family History"], value: record?.familyHistory },
		{ label: translationKeys["Lifestyle Notes"], value: record?.lifestyleNotes },
	].filter((field) => field.value?.trim());
}

function hasMedicalRecordContent(record: MedicalRecord | null | undefined) {
	if (!record) {
		return false;
	}

	return [
		...getMedicalRecordFields(record).map((field) => field.value),
		record.emergencyContactName,
		record.emergencyContactPhone,
	].some((value) => Boolean(value?.trim()));
}

export default function AppointmentDetails() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { isHealthcareProvider, isCustomer } = useAuth();

	const { data: appointmentData, isLoading, error } = useAppointment(id || "", !!id);
	const updateAppointmentMutation = useUpdateAppointment();
	const createConversationMutation = useGetOrCreateConversation();

	const appointment = appointmentData?.appointment;
	const shouldRequestMedicalRecord =
		isHealthcareProvider && appointment?.status === "CONFIRMED";
	const {
		data: medicalRecordData,
		isLoading: isMedicalRecordLoading,
		error: medicalRecordError,
	} = useAppointmentMedicalRecord(
		appointment?.id || "",
		shouldRequestMedicalRecord && !!appointment?.id,
	);

	const handleStatusUpdate = async (appointmentId: string, nextStatus: AppointmentStatus) => {
		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: { status: nextStatus },
			});
			Alert.alert(
				t("common.success"),
				t("common.appointmentUpdatedToStatus", {
					status: t(getStatusConfig(nextStatus).label),
				}),
			);
		} catch (updateError) {
			console.error("Failed to update appointment:", updateError);
			Alert.alert(t("common.error"), t("common.failedToUpdateAppointmentStatusPleaseTryAgain"));
		}
	};

	const handleOpenChat = async (appointmentItem: Appointment) => {
		try {
			const participantId = isHealthcareProvider
				? getAppointmentCustomerUserId(appointmentItem)
				: appointmentItem.healthcareProvider.user.id;

			if (!participantId) {
				Alert.alert(
					t("common.chatUnavailable"),
					t("common.thisPatientDoesNotHaveACustomerAccountYet"),
				);
				return;
			}

			const result = await createConversationMutation.mutateAsync({
				participantId,
			});

			router.push(`/chat/${result.conversation.id}`);
		} catch (chatError) {
			console.error("Failed to open chat:", chatError);
			Alert.alert(t("common.error"), t("common.failedToOpenChat"));
		}
	};

	if (isLoading) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.stateText}>{t("common.loadingAppointment")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !appointment) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<Text style={styles.errorTitle}>{t("common.appointmentNotFound")}</Text>
					<Button onPress={() => router.back()}>{t("common.backToAppointments")}</Button>
				</View>
			</SafeAreaView>
		);
	}

	const statusConfig = getStatusConfig(appointment.status);
	const procedures = appointment.appointmentProcedures.map((ap) => ap.procedure);
	const medicalRecord = medicalRecordData?.medicalRecord;
	const medicalRecordFields = getMedicalRecordFields(medicalRecord);
	const patientName = getAppointmentPatientName(appointment);
	const canShowMedicalRecord =
		shouldRequestMedicalRecord &&
		(isMedicalRecordLoading ||
			Boolean(medicalRecordError) ||
			hasMedicalRecordContent(medicalRecord));
	const counterpart = isHealthcareProvider
		? {
				title: t("common.patient"),
				name: patientName,
				subtitle: getAppointmentPatientSubtitle(appointment),
				image: getAppointmentPatientImage(appointment),
				email: getAppointmentPatientEmail(appointment) || t("common.notInformed"),
				phone: getAppointmentPatientPhone(appointment),
		  }
		: {
				title: t("common.provider"),
				name: appointment.healthcareProvider.user.name,
				subtitle:
					appointment.healthcareProvider.specialty || t("common.healthcareProvider2"),
				image: appointment.healthcareProvider.user.image,
				email: appointment.healthcareProvider.user.email,
				phone: appointment.healthcareProvider.user.phone,
		  };

	const providerActions = isHealthcareProvider
		? getProviderStatusActions(appointment.status)
		: [];
	const canOpenChat =
		!isHealthcareProvider || Boolean(getAppointmentCustomerUserId(appointment));

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<ArrowLeft size={22} color={theme.colors.foreground} strokeWidth={2} />
				</Pressable>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle}>{t("common.appointmentDetails")}</Text>
					<Text style={styles.headerSubtitle}>ID: {appointment.id}</Text>
				</View>
			</View>

			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.heroCard}>
					<View style={styles.heroTopRow}>
						<View style={styles.profileRow}>
							{counterpart.image ? (
								<Image source={{ uri: counterpart.image }} style={styles.avatar} />
							) : (
								<View style={styles.avatarPlaceholder}>
									<Text style={styles.avatarInitial}>
										{counterpart.name.charAt(0).toUpperCase()}
									</Text>
								</View>
							)}
							<View style={styles.profileInfo}>
								<Text style={styles.profileEyebrow}>{counterpart.title}</Text>
								<Text style={styles.profileName}>{counterpart.name}</Text>
								<Text style={styles.profileSubtitle}>{counterpart.subtitle}</Text>
							</View>
						</View>

						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: statusConfig.bgColor },
							]}
						>
							<Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
								{t(statusConfig.label)}
							</Text>
						</View>
					</View>

					<View style={styles.detailGrid}>
						<DetailRow
							icon={Calendar}
							label={t("common.date")}
							value={formatDate(appointment.scheduledAt)}
						/>
						<DetailRow
							icon={Clock}
							label={t("common.time")}
							value={`${formatTime(appointment.scheduledAt)} • ${appointment.totalDurationMinutes} min`}
						/>
						<DetailRow
							icon={DollarSign}
							label={t("common.totalPrice")}
							value={formatPrice(appointment.totalPriceCents)}
						/>
						<DetailRow
							icon={Stethoscope}
							label={t("common.procedures")}
							value={procedures.map((procedure) => procedure.name).join(", ") || t("common.appointment")}
						/>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.contact")}</Text>
					<View style={styles.infoCard}>
						<DetailRow icon={Mail} label={t("common.email")} value={counterpart.email} />
						{counterpart.phone ? (
							<DetailRow icon={Phone} label={t("common.phone")} value={counterpart.phone} />
						) : null}
					</View>
					{canOpenChat ? (
						<View style={styles.actionRow}>
							<Button
								variant="outline"
								style={styles.flexButton}
								onPress={() => handleOpenChat(appointment)}
								disabled={createConversationMutation.isPending}
								loading={createConversationMutation.isPending}
							>
								<View style={styles.inlineButtonContent}>
									<MessageCircle
										size={16}
										color={theme.colors.foreground}
										strokeWidth={2}
									/>
									<Text style={styles.inlineButtonLabel}>{t("common.openChat")}</Text>
								</View>
							</Button>
						</View>
					) : null}
				</View>

				{appointment.patientProfile ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.patientProfile")}</Text>
						<View style={styles.infoCard}>
							{appointment.patientProfile.dateOfBirth ? (
								<DetailRow
									icon={Calendar}
									label={t("common.dateOfBirth")}
									value={formatShortDate(appointment.patientProfile.dateOfBirth)}
								/>
							) : null}
							{appointment.patientProfile.gender ? (
								<DetailRow
									icon={UserRound}
									label={t("common.gender")}
									value={appointment.patientProfile.gender}
								/>
							) : null}
							{appointment.patientProfile.cpf ? (
								<DetailRow
									icon={UserRound}
									label="CPF"
									value={appointment.patientProfile.cpf}
								/>
							) : null}
							{appointment.patientProfile.relationshipToCustomer ? (
								<DetailRow
									icon={Users}
									label={t("common.relationship")}
									value={appointment.patientProfile.relationshipToCustomer}
								/>
							) : null}
							{appointment.patientProfile.notes ? (
								<DetailRow
									icon={FileText}
									label={t("common.profileNotes")}
									value={appointment.patientProfile.notes}
								/>
							) : null}
						</View>
					</View>
				) : null}

				{canShowMedicalRecord ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.medicalRecord")}</Text>
						<View style={styles.infoCard}>
							<View style={styles.medicalRecordHeader}>
								<View style={styles.medicalRecordIcon}>
									<ClipboardPlus
										size={18}
										color={theme.colors.primary}
										strokeWidth={2.2}
									/>
								</View>
								<View style={styles.medicalRecordHeaderText}>
									<Text style={styles.medicalRecordTitle}>
										{t("common.patientHealthSummary")}
									</Text>
									<Text style={styles.medicalRecordSubtitle}>
										{t("common.informationSharedByPatientName", { patientName })}
									</Text>
								</View>
							</View>

							{isMedicalRecordLoading ? (
								<View style={styles.medicalRecordState}>
									<ActivityIndicator
										size="small"
										color={theme.colors.primary}
									/>
									<Text style={styles.medicalRecordStateText}>
										{t("common.loadingMedicalRecord")}
									</Text>
								</View>
							) : null}

							{medicalRecordError && !isMedicalRecordLoading ? (
								<View style={styles.medicalRecordState}>
									<ShieldPlus
										size={18}
										color={theme.colors.destructive}
										strokeWidth={2.2}
									/>
									<Text style={styles.medicalRecordStateText}>
										{t("common.couldNotLoadThisMedicalRecord")}
									</Text>
								</View>
							) : null}

							{!isMedicalRecordLoading &&
							!medicalRecordError &&
							medicalRecord ? (
								<View style={styles.medicalRecordContent}>
									<View style={styles.medicalQuickFacts}>
										<View style={styles.medicalQuickFact}>
											<Droplets
												size={16}
												color={theme.colors.destructive}
												strokeWidth={2.2}
											/>
											<Text style={styles.medicalQuickFactText}>
												{medicalRecord.bloodType || t("common.bloodTypeNotInformed")}
											</Text>
										</View>
										<View style={styles.medicalQuickFact}>
											<Pill
												size={16}
												color={theme.colors.primary}
												strokeWidth={2.2}
											/>
											<Text style={styles.medicalQuickFactText}>
												{medicalRecord.medications
													? t("common.usesMedication")
													: t("common.noMedicationsInformed")}
											</Text>
										</View>
										<View style={styles.medicalQuickFact}>
											<HeartPulse
												size={16}
												color={theme.colors.coral500}
												strokeWidth={2.2}
											/>
											<Text style={styles.medicalQuickFactText}>
												{medicalRecord.preExistingConditions
													? t("common.hasHealthHistory")
													: t("common.noConditionsInformed")}
											</Text>
										</View>
									</View>

									{medicalRecordFields.length > 0 ? (
										<View style={styles.medicalRecordList}>
											{medicalRecordFields.map((field) => (
												<MedicalRecordItem
													key={field.label}
													label={field.label}
													value={field.value}
												/>
											))}
										</View>
									) : null}

									{medicalRecord.emergencyContactName ||
									medicalRecord.emergencyContactPhone ? (
										<View style={styles.emergencyContact}>
											<Phone
												size={16}
												color={theme.colors.destructive}
												strokeWidth={2.2}
											/>
											<View style={styles.emergencyContactText}>
												<Text style={styles.emergencyContactLabel}>
													{t("common.emergencyContact")}
												</Text>
												<Text style={styles.emergencyContactValue}>
													{[
														medicalRecord.emergencyContactName,
														medicalRecord.emergencyContactPhone,
													]
														.filter(Boolean)
														.join(" • ")}
												</Text>
											</View>
										</View>
									) : null}
								</View>
							) : null}
						</View>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.procedures")}</Text>
					<View style={styles.infoCard}>
						{procedures.map((procedure) => (
							<View key={procedure.id} style={styles.procedureItem}>
								<View style={styles.procedureHeader}>
									<Text style={styles.procedureName}>{procedure.name}</Text>
									<Text style={styles.procedurePrice}>
										{formatPrice(procedure.priceInCents)}
									</Text>
								</View>
								<Text style={styles.procedureMeta}>
									{procedure.durationInMinutes} min
								</Text>
								{procedure.description ? (
									<Text style={styles.procedureDescription}>
										{procedure.description}
									</Text>
								) : null}
							</View>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.notes")}</Text>
					<View style={styles.infoCard}>
						<View style={styles.notesHeader}>
							<FileText
								size={18}
								color={theme.colors.primary}
								strokeWidth={2}
							/>
							<Text style={styles.notesTitle}>
								{isHealthcareProvider ? t("common.appointmentNotes") : t("common.providerNotes")}
							</Text>
						</View>
						<Text style={styles.notesText}>
							{appointment.notes?.trim() ||
								(isCustomer
									? t("common.noNotesWereAddedToThisAppointment")
									: t("common.noNotesAddedYetForThisAppointment"))}
						</Text>
					</View>
				</View>

				{isHealthcareProvider && providerActions.length > 0 ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.updateStatus")}</Text>
						<View style={styles.statusActions}>
							{providerActions.map((action) => (
								<Button
									key={action.status}
									variant={action.variant || "outline"}
									style={styles.statusActionButton}
									onPress={() =>
										handleStatusUpdate(appointment.id, action.status)
									}
									disabled={updateAppointmentMutation.isPending}
									loading={
										updateAppointmentMutation.isPending &&
										updateAppointmentMutation.variables?.appointmentId ===
											appointment.id &&
										updateAppointmentMutation.variables?.data.status ===
											action.status
									}
								>
									{t(action.label)}
								</Button>
							))}
						</View>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.appointmentMeta")}</Text>
					<View style={styles.infoCard}>
						<DetailRow
							icon={UserRound}
							label={t("common.customerID")}
							value={appointment.customerId || t("common.noCustomerAccount")}
						/>
						{appointment.patientProfileId ? (
							<DetailRow
								icon={UserRound}
								label={t("common.patientProfileID")}
								value={appointment.patientProfileId}
							/>
						) : null}
						<DetailRow
							icon={UserRound}
							label={t("common.providerID")}
							value={appointment.healthcareProviderId}
						/>
						<DetailRow
							icon={Calendar}
							label={t("common.created")}
							value={formatDate(appointment.createdAt)}
						/>
						<DetailRow
							icon={Calendar}
							label={t("common.lastUpdated")}
							value={formatDate(appointment.updatedAt)}
						/>
					</View>
				</View>
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
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: theme.gap(2),
	},
	headerContent: {
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
		marginTop: theme.gap(0.5),
	},
	scrollContent: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	centerState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(4),
		gap: theme.gap(3),
	},
	stateText: {
		fontSize: 15,
		color: theme.colors.mutedForeground,
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	heroCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(3),
	},
	heroTopRow: {
		gap: theme.gap(2),
	},
	profileRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 32,
	},
	avatarPlaceholder: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarInitial: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	profileInfo: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	profileEyebrow: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		color: theme.colors.mutedForeground,
	},
	profileName: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	profileSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	statusBadge: {
		alignSelf: "flex-start",
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1),
		borderRadius: theme.radius.full,
	},
	statusBadgeText: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	detailGrid: {
		gap: theme.gap(2),
	},
	section: {
		gap: theme.gap(2),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	infoCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(2),
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(2),
	},
	detailIconWrap: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
	},
	detailContent: {
		flex: 1,
		gap: theme.gap(0.25),
	},
	detailLabel: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		color: theme.colors.mutedForeground,
	},
	detailValue: {
		fontSize: 15,
		lineHeight: 21,
		color: theme.colors.foreground,
	},
	actionRow: {
		flexDirection: "row",
	},
	flexButton: {
		flex: 1,
	},
	inlineButtonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	inlineButtonLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	procedureItem: {
		gap: theme.gap(0.75),
		paddingBottom: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	procedureHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	procedureName: {
		flex: 1,
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	procedurePrice: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.primary,
	},
	procedureMeta: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	procedureDescription: {
		fontSize: 14,
		lineHeight: 20,
		color: theme.colors.foreground,
	},
	notesHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	notesTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	notesText: {
		fontSize: 14,
		lineHeight: 21,
		color: theme.colors.foreground,
	},
	medicalRecordHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	medicalRecordIcon: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
	},
	medicalRecordHeaderText: {
		flex: 1,
		gap: theme.gap(0.25),
	},
	medicalRecordTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	medicalRecordSubtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	medicalRecordState: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
	},
	medicalRecordStateText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
		color: theme.colors.mutedForeground,
	},
	medicalRecordContent: {
		gap: theme.gap(2),
	},
	medicalQuickFacts: {
		gap: theme.gap(1),
	},
	medicalQuickFact: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.lg,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1.25),
	},
	medicalQuickFactText: {
		flex: 1,
		fontSize: 13,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	medicalRecordList: {
		gap: theme.gap(1.25),
	},
	medicalRecordItem: {
		gap: theme.gap(0.5),
	},
	medicalRecordLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		color: theme.colors.mutedForeground,
	},
	medicalRecordValue: {
		fontSize: 14,
		lineHeight: 20,
		color: theme.colors.foreground,
	},
	emergencyContact: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(1),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.accent,
		padding: theme.gap(1.5),
	},
	emergencyContactText: {
		flex: 1,
		gap: theme.gap(0.25),
	},
	emergencyContactLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		color: theme.colors.accentForeground,
	},
	emergencyContactValue: {
		fontSize: 14,
		lineHeight: 20,
		color: theme.colors.foreground,
	},
	statusActions: {
		gap: theme.gap(2),
	},
	statusActionButton: {
		width: "100%",
	},
}));
