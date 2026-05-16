import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	ClipboardPlus,
	DollarSign,
	Droplets,
	FileText,
	HeartPulse,
	Mail,
	MessageCircle,
	NotebookPen,
	Phone,
	Pill,
	ShieldPlus,
	Stethoscope,
	UserRound,
	Users,
	Video,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Linking,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { SelectInput } from "@/components/ui/select-input";
import {
	buildRecurrencePayload,
	RecurrenceFields,
	type RecurrenceFormValue,
} from "@/components/appointments/recurrence-fields";
import { getServiceModalityLabelKey } from "@/constants/service-modalities";
import { useAuth } from "@/contexts/auth";
import {
	useAppointment,
	useDeleteAppointmentRecurringSeries,
	useRequestAppointmentReschedule,
	useRespondAppointmentReschedule,
	useTimeSlots,
	useUpdateAppointment,
	useUpdateAppointmentRecurringSeries,
} from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import { useAppointmentEvolutionNote, useUpsertAppointmentEvolutionNote } from "@/hooks/use-appointment-evolution-notes";
import { useAppointmentMedicalRecord } from "@/hooks/use-medical-record";
import { canDisplayProviderPrices } from "@/lib/provider-pricing";
import type { Appointment, AppointmentEvolutionStatus, AppointmentStatus } from "@/types/appointment";
import type { MedicalRecord } from "@/types/medical-record";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import { showErrorToast, showSuccessToast } from "@/services/toast";
import {
	buildUtcDateTimeISO,
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

function getCancellationPolicyPreview(appointment?: Appointment) {
	if (!appointment?.healthcareProvider.cancellationPolicyEnabled) {
		return { applies: false, feeInCents: null, requiresJustification: false };
	}

	const hoursBefore = appointment.healthcareProvider.cancellationPolicyHoursBefore;
	if (hoursBefore === null) {
		return { applies: false, feeInCents: null, requiresJustification: false };
	}

	const hoursUntilAppointment =
		(new Date(appointment.scheduledAt).getTime() - Date.now()) /
		(1000 * 60 * 60);
	const applies = hoursUntilAppointment < hoursBefore;

	if (!applies) {
		return { applies: false, feeInCents: null, requiresJustification: false };
	}

	if (appointment.healthcareProvider.cancellationPolicyPenaltyType === "FIXED") {
		return {
			applies: true,
			feeInCents: appointment.healthcareProvider.cancellationPolicyFixedFeeCents ?? 0,
			requiresJustification:
				appointment.healthcareProvider.cancellationPolicyRequiresJustification,
		};
	}

	if (
		appointment.healthcareProvider.cancellationPolicyPenaltyType === "PERCENTAGE"
	) {
		return {
			applies: true,
			feeInCents: Math.round(
				appointment.totalPriceCents *
					((appointment.healthcareProvider.cancellationPolicyPercentage ?? 0) /
						100),
			),
			requiresJustification:
				appointment.healthcareProvider.cancellationPolicyRequiresJustification,
		};
	}

	return {
		applies: true,
		feeInCents: 0,
		requiresJustification:
			appointment.healthcareProvider.cancellationPolicyRequiresJustification,
	};
}

const todayDateString = () => new Date().toISOString().split("T")[0] || "";

const getBookingWindowMaxDate = (bookingAvailabilityDays?: number | null) => {
	const days = Math.min(Math.max(bookingAvailabilityDays ?? 90, 1), 365);
	const date = new Date();
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().split("T")[0] || "";
};

const weekDayLabel = (dayOfWeek: number) =>
	["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dayOfWeek] || "Dia";

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

type EvolutionNoteFormState = {
	subjective: string;
	objective: string;
	assessment: string;
	plan: string;
	painLevel: string;
	painLocation: string;
	evolutionStatus: "" | AppointmentEvolutionStatus;
};

const emptyEvolutionNoteForm: EvolutionNoteFormState = {
	subjective: "",
	objective: "",
	assessment: "",
	plan: "",
	painLevel: "",
	painLocation: "",
	evolutionStatus: "",
};

function buildEvolutionNoteForm(
	note?: {
		subjective: string | null;
		objective: string | null;
		assessment: string | null;
		plan: string | null;
		painLevel: number | null;
		painLocation: string | null;
		evolutionStatus: AppointmentEvolutionStatus | null;
	} | null,
): EvolutionNoteFormState {
	return {
		subjective: note?.subjective || "",
		objective: note?.objective || "",
		assessment: note?.assessment || "",
		plan: note?.plan || "",
		painLevel: note?.painLevel?.toString() || "",
		painLocation: note?.painLocation || "",
		evolutionStatus: note?.evolutionStatus || "",
	};
}

export default function AppointmentDetails() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { isHealthcareProvider, isCustomer, healthcareProvider } = useAuth();
	const [showRescheduleForm, setShowRescheduleForm] = useState(false);
	const [showCancellationForm, setShowCancellationForm] = useState(false);
	const [showRecurringEditor, setShowRecurringEditor] = useState(false);
	const [cancellationReason, setCancellationReason] = useState("");
	const [rescheduleDate, setRescheduleDate] = useState("");
	const [rescheduleTime, setRescheduleTime] = useState("");
	const [rescheduleReason, setRescheduleReason] = useState("");
	const [evolutionNoteForm, setEvolutionNoteForm] =
		useState<EvolutionNoteFormState>(emptyEvolutionNoteForm);
	const [recurringForm, setRecurringForm] = useState<RecurrenceFormValue>({
		enabled: true,
		isIndefinite: false,
		endsOn: "",
		weeklySlots: [],
	});

	const { data: appointmentData, isLoading, error } = useAppointment(id || "", !!id);
	const updateAppointmentMutation = useUpdateAppointment();
	const requestRescheduleMutation = useRequestAppointmentReschedule();
	const respondRescheduleMutation = useRespondAppointmentReschedule();
	const updateRecurringSeriesMutation = useUpdateAppointmentRecurringSeries();
	const deleteRecurringSeriesMutation = useDeleteAppointmentRecurringSeries();
	const createConversationMutation = useGetOrCreateConversation();

	const appointment = appointmentData?.appointment;
	const bookingWindowMaxDate = getBookingWindowMaxDate(
		appointment?.healthcareProvider.bookingAvailabilityDays,
	);
	const rescheduleProcedureIds =
		appointment?.appointmentProcedures.map((item) => item.procedureId) || [];
	const { data: timeSlotsData, isLoading: isLoadingTimeSlots } = useTimeSlots({
		healthcareProviderId: appointment?.healthcareProviderId || "",
		date: rescheduleDate,
		procedureIds: rescheduleProcedureIds,
		enabled:
			!!appointment?.healthcareProviderId &&
			!!rescheduleDate &&
			rescheduleProcedureIds.length > 0,
	});
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
	const canManageEvolutionNote =
		isHealthcareProvider &&
		appointment?.healthcareProviderId === healthcareProvider?.id;
	const {
		data: evolutionNoteData,
		isLoading: isEvolutionNoteLoading,
	} = useAppointmentEvolutionNote(
		appointment?.id || "",
		Boolean(canManageEvolutionNote && appointment?.id),
	);
	const upsertEvolutionNoteMutation = useUpsertAppointmentEvolutionNote(
		appointment?.id || "",
	);

	useEffect(() => {
		setEvolutionNoteForm(buildEvolutionNoteForm(evolutionNoteData?.evolutionNote));
	}, [evolutionNoteData?.evolutionNote]);

	const handleStatusUpdate = async (appointmentId: string, nextStatus: AppointmentStatus) => {
		if (nextStatus === "CANCELLED") {
			setShowCancellationForm(true);
			return;
		}

		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: { status: nextStatus },
			});
			showSuccessToast("common.appointmentUpdatedToStatus", {
				status: t(getStatusConfig(nextStatus).label),
			});
		} catch (updateError) {
			console.error("Failed to update appointment:", updateError);
			showErrorToast("common.failedToUpdateAppointmentStatusPleaseTryAgain");
		}
	};

	const handleConfirmCancellation = async () => {
		if (!appointment) return;

		const cancellationPolicyPreview = getCancellationPolicyPreview(appointment);
		if (
			cancellationPolicyPreview.requiresJustification &&
			!cancellationReason.trim()
		) {
			Alert.alert(
				t("common.checkTheForm"),
				t("common.cancellationJustificationRequired"),
			);
			return;
		}

		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId: appointment.id,
				data: {
					status: "CANCELLED",
					cancellationReason: cancellationReason.trim() || null,
				},
			});
			setShowCancellationForm(false);
			setCancellationReason("");
			showSuccessToast("common.appointmentCancelled");
		} catch (updateError) {
			console.error("Failed to cancel appointment:", updateError);
			showErrorToast("common.failedToUpdateAppointmentStatusPleaseTryAgain");
		}
	};

	const handleOpenChat = async (appointmentItem: Appointment) => {
		try {
			const participantId = isHealthcareProvider
				? getAppointmentCustomerUserId(appointmentItem)
				: appointmentItem.healthcareProvider.id;

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

	const handleOpenOnlineMeeting = async (url: string) => {
		await Linking.openURL(url);
	};

	const handleSubmitReschedule = async () => {
		if (!appointment || !rescheduleDate || !rescheduleTime) {
			return;
		}

		try {
			await requestRescheduleMutation.mutateAsync({
				appointmentId: appointment.id,
				data: {
					scheduledAt: buildUtcDateTimeISO(rescheduleDate, rescheduleTime),
					reason: rescheduleReason.trim() || null,
				},
			});

			setShowRescheduleForm(false);
			setRescheduleDate("");
			setRescheduleTime("");
			setRescheduleReason("");
			showSuccessToast("common.appointmentRescheduleRequested");
		} catch (rescheduleError) {
			console.error("Failed to reschedule appointment:", rescheduleError);
			showErrorToast("common.failedToRescheduleAppointment");
		}
	};

	const handleOpenRecurringEditor = () => {
		if (!appointment?.recurringSeries) return;

		setRecurringForm({
			enabled: true,
			isIndefinite: appointment.recurringSeries.isIndefinite,
			endsOn: appointment.recurringSeries.endsOn?.slice(0, 10) || "",
			weeklySlots: appointment.recurringSeries.weeklySlots.map((slot) => ({
				dayOfWeek: String(slot.dayOfWeek),
				startTime: slot.startTime,
			})),
		});
		setShowRecurringEditor((current) => !current);
	};

	const handleSaveRecurringSeries = async () => {
		if (!appointment?.recurringSeries) return;

		const recurrence = buildRecurrencePayload(recurringForm);
		if (!recurrence) return;

		try {
			await updateRecurringSeriesMutation.mutateAsync({
				seriesId: appointment.recurringSeries.id,
				data: {
					notes: appointment.notes,
					recurrence,
				},
			});
			setShowRecurringEditor(false);
			showSuccessToast("common.scheduleSavedSuccessfully");
		} catch (error) {
			console.error("Failed to update recurring series:", error);
			showErrorToast("common.failedToSaveSchedulePleaseTryAgain");
		}
	};

	const handleCancelRecurringSeries = async () => {
		if (!appointment?.recurringSeries) return;

		try {
			await deleteRecurringSeriesMutation.mutateAsync(
				appointment.recurringSeries.id,
			);
			showSuccessToast("common.appointmentCancelled");
		} catch (error) {
			console.error("Failed to cancel recurring series:", error);
			showErrorToast("common.failedToUpdateAppointmentStatusPleaseTryAgain");
		}
	};

	const handleRespondToReschedule = async (
		requestId: string,
		action: "ACCEPT" | "DECLINE",
	) => {
		if (!appointment) {
			return;
		}

		try {
			await respondRescheduleMutation.mutateAsync({
				appointmentId: appointment.id,
				requestId,
				data: { action },
			});
			showSuccessToast("common.appointmentRescheduleResponded");
		} catch (respondError) {
			console.error("Failed to respond to reschedule request:", respondError);
			showErrorToast("common.failedToCompleteActionPleaseTryAgain");
		}
	};

	const handleSaveEvolutionNote = async () => {
		if (!appointment) {
			return;
		}

		try {
			await upsertEvolutionNoteMutation.mutateAsync({
				subjective: evolutionNoteForm.subjective.trim() || null,
				objective: evolutionNoteForm.objective.trim() || null,
				assessment: evolutionNoteForm.assessment.trim() || null,
				plan: evolutionNoteForm.plan.trim() || null,
				painLevel: evolutionNoteForm.painLevel.trim()
					? Number(evolutionNoteForm.painLevel)
					: null,
				painLocation: evolutionNoteForm.painLocation.trim() || null,
				evolutionStatus: evolutionNoteForm.evolutionStatus || null,
			});
			showSuccessToast("common.toastEvolutionNoteSaved");
		} catch (noteError) {
			console.error("Failed to save evolution note:", noteError);
			showErrorToast("common.toastEvolutionNoteSaveFailed");
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
	const canShowPrices =
		isHealthcareProvider || canDisplayProviderPrices(appointment.healthcareProvider);
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
				name: appointment.healthcareProvider.name,
				subtitle:
					appointment.healthcareProvider.specialty || t("common.healthcareProvider2"),
				image: appointment.healthcareProvider.image,
				email: appointment.healthcareProvider.email,
				phone: appointment.healthcareProvider.phone,
		  };

	const providerActions = isHealthcareProvider
		? getProviderStatusActions(appointment.status)
		: [];
	const canOpenChat =
		!isHealthcareProvider || Boolean(getAppointmentCustomerUserId(appointment));
	const pendingRescheduleRequest = appointment.rescheduleRequests.find(
		(request) => request.status === "PENDING",
	);
	const canReschedule =
		appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
	const canCancel =
		appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
	const cancellationPolicyPreview = getCancellationPolicyPreview(appointment);
	const availableRescheduleSlots =
		timeSlotsData?.slots.filter((slot) => slot.available) || [];
	const canEditEvolutionNote =
		canManageEvolutionNote &&
		(appointment.status === "IN_PROGRESS" || appointment.status === "COMPLETED");
	const evolutionStatusOptions = [
		{ value: "IMPROVED", label: t("common.evolutionImproved") },
		{ value: "STABLE", label: t("common.evolutionStable") },
		{ value: "WORSENED", label: t("common.evolutionWorsened") },
	];

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
							value={
								canShowPrices
									? formatPrice(appointment.totalPriceCents)
									: t("common.priceOnRequest")
							}
						/>
						<DetailRow
							icon={HeartPulse}
							label={t("common.appointmentServiceModality")}
							value={t(
								getServiceModalityLabelKey(appointment.serviceModality) ||
									"common.notInformed",
							)}
						/>
						{appointment.onlineMeetingUrl ? (
							<DetailRow
								icon={Video}
								label={t("common.onlineMeeting")}
								value="Google Meet"
							/>
						) : null}
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
						{appointment.onlineMeetingUrl ? (
							<View style={styles.actionRow}>
								<Button
									style={styles.flexButton}
									onPress={() =>
										handleOpenOnlineMeeting(appointment.onlineMeetingUrl as string)
									}
							>
								<View style={styles.inlineButtonContent}>
									<Video
										size={16}
										color={theme.colors.primaryForeground}
										strokeWidth={2}
									/>
									<Text style={styles.primaryInlineButtonLabel}>
										{t("common.openGoogleMeet")}
									</Text>
								</View>
								</Button>
							</View>
						) : null}
						{canReschedule ? (
							<View style={styles.actionRow}>
								<Button
									variant="outline"
									style={styles.flexButton}
									onPress={() => setShowRescheduleForm((current) => !current)}
								>
									Reagendar consulta
								</Button>
							</View>
						) : null}
						{isCustomer && canCancel ? (
							<View style={styles.actionRow}>
								<Button
									variant="destructive"
									style={styles.flexButton}
									onPress={() => setShowCancellationForm((current) => !current)}
									disabled={updateAppointmentMutation.isPending}
								>
									{t("common.cancelAppointment")}
								</Button>
							</View>
						) : null}
					</View>

				{appointment.status === "CANCELLED" ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.cancellation")}</Text>
						<View style={styles.infoCard}>
							{appointment.cancelledAt ? (
								<DetailRow
									icon={Calendar}
									label={t("common.cancelledAt")}
									value={`${formatDate(appointment.cancelledAt)} ${formatTime(appointment.cancelledAt)}`}
								/>
							) : null}
							{appointment.cancelledByUser ? (
								<DetailRow
									icon={UserRound}
									label={t("common.cancelledBy")}
									value={appointment.cancelledByUser.name}
								/>
							) : null}
							{appointment.cancellationReason ? (
								<DetailRow
									icon={MessageCircle}
									label={t("common.justification")}
									value={appointment.cancellationReason}
								/>
							) : null}
						{canShowPrices && appointment.cancellationFeeCents !== null ? (
								<DetailRow
									icon={DollarSign}
									label={t("common.estimatedCancellationFee")}
									value={formatPrice(appointment.cancellationFeeCents)}
								/>
							) : null}
						</View>
					</View>
				) : null}

				{pendingRescheduleRequest ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Solicitação de reagendamento</Text>
						<View style={styles.infoCard}>
							<Text style={styles.notesText}>
								Novo horário proposto:{" "}
								{formatDate(pendingRescheduleRequest.proposedScheduledAt)} às{" "}
								{formatTime(pendingRescheduleRequest.proposedScheduledAt)}
							</Text>
							{pendingRescheduleRequest.reason ? (
								<Text style={styles.notesText}>
									Motivo: {pendingRescheduleRequest.reason}
								</Text>
							) : null}
							{isCustomer ? (
								<View style={styles.statusActions}>
									<Button
										disabled={respondRescheduleMutation.isPending}
										loading={respondRescheduleMutation.isPending}
										onPress={() =>
											handleRespondToReschedule(
												pendingRescheduleRequest.id,
												"ACCEPT",
											)
										}
									>
										Aceitar novo horário
									</Button>
									<Button
										variant="outline"
										disabled={respondRescheduleMutation.isPending}
										onPress={() =>
											handleRespondToReschedule(
												pendingRescheduleRequest.id,
												"DECLINE",
											)
										}
									>
										Recusar
									</Button>
								</View>
							) : (
								<Text style={styles.notesText}>
									Aguardando resposta do paciente.
								</Text>
							)}
						</View>
					</View>
				) : null}

				{appointment.recurringSeries ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Recorrência</Text>
						<View style={styles.infoCard}>
							<Text style={styles.notesText}>
								{appointment.recurringSeries.isIndefinite
									? "Essa consulta faz parte de uma recorrência sem data para encerrar."
									: `Essa consulta faz parte de uma recorrência até ${formatShortDate(
											appointment.recurringSeries.endsOn || appointment.scheduledAt,
										)}.`}
							</Text>
							<View style={styles.slotGrid}>
								{appointment.recurringSeries.weeklySlots.map((slot) => (
									<View key={slot.id} style={styles.timeSlot}>
										<Text style={styles.timeSlotText}>
											{weekDayLabel(slot.dayOfWeek)} · {slot.startTime}
										</Text>
									</View>
								))}
							</View>
							<View style={styles.statusActions}>
								<Button variant="outline" onPress={handleOpenRecurringEditor}>
									Editar recorrência
								</Button>
								<Button
									variant="destructive"
									loading={deleteRecurringSeriesMutation.isPending}
									onPress={handleCancelRecurringSeries}
								>
									Encerrar recorrência
								</Button>
							</View>
							{showRecurringEditor ? (
								<View style={styles.recurringEditor}>
									<RecurrenceFields
										baseDate={appointment.scheduledAt.slice(0, 10)}
										baseTime={appointment.scheduledAt.slice(11, 16)}
										value={recurringForm}
										onChange={setRecurringForm}
									/>
									<Button
										loading={updateRecurringSeriesMutation.isPending}
										onPress={handleSaveRecurringSeries}
									>
										Salvar recorrência
									</Button>
								</View>
							) : null}
						</View>
					</View>
				) : null}

				{showRescheduleForm ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Escolher novo horário</Text>
						<View style={styles.infoCard}>
							<DatePickerInput
								value={rescheduleDate}
								minDate={todayDateString()}
								maxDate={bookingWindowMaxDate}
								onChange={(dateString) => {
									setRescheduleDate(dateString);
									setRescheduleTime("");
								}}
							/>
							{rescheduleDate ? (
								<View style={styles.rescheduleSlots}>
									<Text style={styles.notesTitle}>Horários disponíveis</Text>
									{isLoadingTimeSlots ? (
										<ActivityIndicator
											size="small"
											color={theme.colors.primary}
										/>
									) : null}
									{availableRescheduleSlots.length > 0 ? (
										<View style={styles.slotGrid}>
											{availableRescheduleSlots.map((slot) => (
												<Pressable
													key={slot.startTime}
													onPress={() => setRescheduleTime(slot.startTime)}
													style={[
														styles.timeSlot,
														rescheduleTime === slot.startTime &&
															styles.timeSlotSelected,
													]}
												>
													<Text
														style={[
															styles.timeSlotText,
															rescheduleTime === slot.startTime &&
																styles.timeSlotTextSelected,
														]}
													>
														{slot.startTime}
													</Text>
												</Pressable>
											))}
										</View>
									) : null}
									{!isLoadingTimeSlots && availableRescheduleSlots.length === 0 ? (
										<Text style={styles.notesText}>
											Nenhum horário disponível nessa data.
										</Text>
									) : null}
								</View>
							) : null}
							{isHealthcareProvider ? (
								<TextInput
									value={rescheduleReason}
									onChangeText={setRescheduleReason}
									placeholder="Motivo da solicitação"
									multiline
									style={styles.rescheduleReasonInput}
								/>
							) : null}
							<Button
								disabled={!rescheduleTime || requestRescheduleMutation.isPending}
								loading={requestRescheduleMutation.isPending}
								onPress={handleSubmitReschedule}
							>
								{isHealthcareProvider
									? "Enviar solicitação"
									: "Confirmar novo horário"}
							</Button>
						</View>
					</View>
				) : null}

				{showCancellationForm ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.cancelAppointment")}</Text>
						<View style={styles.infoCard}>
							{cancellationPolicyPreview.applies ? (
								<View style={styles.warningBox}>
									<Text style={styles.warningTitle}>
										{t("common.cancellationPolicyWillApply")}
									</Text>
									{canShowPrices && cancellationPolicyPreview.feeInCents !== null ? (
										<Text style={styles.warningText}>
											{t("common.estimatedCancellationFee")}:{" "}
											{formatPrice(cancellationPolicyPreview.feeInCents)}
										</Text>
									) : null}
								</View>
							) : (
								<Text style={styles.notesText}>
									{t("common.cancellationPolicyWillNotApply")}
								</Text>
							)}
							<TextInput
								value={cancellationReason}
								onChangeText={setCancellationReason}
								placeholder={
									cancellationPolicyPreview.requiresJustification
										? t("common.requiredJustification")
										: t("common.optionalJustification")
								}
								multiline
								style={styles.rescheduleReasonInput}
							/>
							<View style={styles.statusActions}>
								<Button
									variant="outline"
									onPress={() => setShowCancellationForm(false)}
								>
									{t("common.cancel")}
								</Button>
								<Button
									variant="destructive"
									disabled={
										updateAppointmentMutation.isPending ||
										(cancellationPolicyPreview.requiresJustification &&
											!cancellationReason.trim())
									}
									loading={updateAppointmentMutation.isPending}
									onPress={handleConfirmCancellation}
								>
									{t("common.confirmCancellation")}
								</Button>
							</View>
						</View>
					</View>
				) : null}

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

				{canManageEvolutionNote ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("common.evolutionNote")}</Text>
						<View style={styles.infoCard}>
							<View style={styles.notesHeader}>
								<NotebookPen
									size={18}
									color={theme.colors.primary}
									strokeWidth={2}
								/>
								<Text style={styles.notesTitle}>
									{t("common.evolutionNote")}
								</Text>
							</View>

							{!canEditEvolutionNote && !evolutionNoteData?.evolutionNote ? (
								<Text style={styles.notesText}>
									{t("common.evolutionNoteAvailableAfterAppointmentStarts")}
								</Text>
							) : null}

							{canEditEvolutionNote || evolutionNoteData?.evolutionNote ? (
								<View style={styles.evolutionForm}>
									<View style={styles.evolutionField}>
										<Text style={styles.evolutionFieldLabel}>
											{t("common.subjective")}
										</Text>
										<TextInput
											value={evolutionNoteForm.subjective}
											onChangeText={(value) =>
												setEvolutionNoteForm((current) => ({
													...current,
													subjective: value,
												}))
											}
											placeholder={t("common.evolutionSubjectivePlaceholder")}
											multiline
											style={styles.rescheduleReasonInput}
										/>
									</View>

									<View style={styles.evolutionGrid}>
										<View style={styles.evolutionField}>
											<Text style={styles.evolutionFieldLabel}>
												{t("common.painLevel")}
											</Text>
											<TextInput
												value={evolutionNoteForm.painLevel}
												onChangeText={(value) =>
													setEvolutionNoteForm((current) => ({
														...current,
														painLevel: value,
													}))
												}
												placeholder="0-10"
												keyboardType="number-pad"
												style={styles.evolutionInput}
											/>
										</View>
										<View style={styles.evolutionField}>
											<Text style={styles.evolutionFieldLabel}>
												{t("common.painLocation")}
											</Text>
											<TextInput
												value={evolutionNoteForm.painLocation}
												onChangeText={(value) =>
													setEvolutionNoteForm((current) => ({
														...current,
														painLocation: value,
													}))
												}
												placeholder={t("common.evolutionPainLocationPlaceholder")}
												style={styles.evolutionInput}
											/>
										</View>
									</View>

									<View style={styles.evolutionField}>
										<Text style={styles.evolutionFieldLabel}>
											{t("common.clinicalEvolution")}
										</Text>
										<SelectInput
											value={evolutionNoteForm.evolutionStatus}
											onChange={(value) =>
												setEvolutionNoteForm((current) => ({
													...current,
													evolutionStatus:
														value as EvolutionNoteFormState["evolutionStatus"],
												}))
											}
											options={evolutionStatusOptions}
											placeholder={t("common.selectClinicalEvolution")}
										/>
									</View>

									<View style={styles.evolutionField}>
										<Text style={styles.evolutionFieldLabel}>
											{t("common.objective")}
										</Text>
										<TextInput
											value={evolutionNoteForm.objective}
											onChangeText={(value) =>
												setEvolutionNoteForm((current) => ({
													...current,
													objective: value,
												}))
											}
											placeholder={t("common.evolutionObjectivePlaceholder")}
											multiline
											style={styles.rescheduleReasonInput}
										/>
									</View>

									<View style={styles.evolutionField}>
										<Text style={styles.evolutionFieldLabel}>
											{t("common.assessment")}
										</Text>
										<TextInput
											value={evolutionNoteForm.assessment}
											onChangeText={(value) =>
												setEvolutionNoteForm((current) => ({
													...current,
													assessment: value,
												}))
											}
											placeholder={t("common.evolutionAssessmentPlaceholder")}
											multiline
											style={styles.rescheduleReasonInput}
										/>
									</View>

									<View style={styles.evolutionField}>
										<Text style={styles.evolutionFieldLabel}>
											{t("common.plan")}
										</Text>
										<TextInput
											value={evolutionNoteForm.plan}
											onChangeText={(value) =>
												setEvolutionNoteForm((current) => ({
													...current,
													plan: value,
												}))
											}
											placeholder={t("common.evolutionPlanPlaceholder")}
											multiline
											style={styles.rescheduleReasonInput}
										/>
									</View>

									{canEditEvolutionNote ? (
										<Button
											loading={upsertEvolutionNoteMutation.isPending}
											onPress={handleSaveEvolutionNote}
										>
											{t("common.saveEvolutionNote")}
										</Button>
									) : null}
								</View>
							) : null}

							<View style={styles.evolutionHistory}>
								<Text style={styles.notesTitle}>
									{t("common.evolutionHistory")}
								</Text>
								{isEvolutionNoteLoading ? (
									<Text style={styles.notesText}>{t("common.loading")}</Text>
								) : evolutionNoteData?.history.length ? (
									evolutionNoteData.history.map((note) => (
										<View key={note.id} style={styles.evolutionHistoryItem}>
											<View style={styles.evolutionHistoryHeader}>
												<Text style={styles.evolutionHistoryDate}>
													{formatShortDate(note.appointment.scheduledAt)}
												</Text>
												<Text style={styles.evolutionHistoryStatus}>
													{note.evolutionStatus
														? t(
																note.evolutionStatus === "IMPROVED"
																	? "common.evolutionImproved"
																	: note.evolutionStatus === "STABLE"
																		? "common.evolutionStable"
																		: "common.evolutionWorsened",
														  )
														: t("common.notInformed")}
												</Text>
											</View>
											<Text style={styles.notesText}>
												{`${t("common.painLevel")}: ${
													note.painLevel ?? t("common.notInformed")
												} · ${t("common.painLocation")}: ${
													note.painLocation || t("common.notInformed")
												}`}
											</Text>
											{note.subjective ? (
												<Text style={styles.notesText}>{note.subjective}</Text>
											) : null}
											{note.assessment ? (
												<Text style={styles.evolutionHistorySecondary}>
													{note.assessment}
												</Text>
											) : null}
										</View>
									))
								) : (
									<Text style={styles.notesText}>
										{t("common.noEvolutionHistoryYet")}
									</Text>
								)}
							</View>
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
										{canShowPrices
											? formatPrice(procedure.priceInCents)
											: t("common.priceOnRequest")}
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
								{procedure.checklistItems.length > 0 ? (
									<View style={styles.preProcedureChecklist}>
										<Text style={styles.preProcedureChecklistTitle}>
											{t("common.preProcedureChecklist")}
										</Text>
										{procedure.checklistItems.map((item) => (
											<View key={item.id} style={styles.preProcedureChecklistItem}>
												<CheckCircle2
													size={15}
													color={theme.colors.primary}
													strokeWidth={2}
												/>
												<Text style={styles.preProcedureChecklistText}>
													{item.text}
												</Text>
											</View>
										))}
									</View>
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
	primaryInlineButtonLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
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
	preProcedureChecklist: {
		marginTop: theme.gap(1),
		gap: theme.gap(1),
		padding: theme.gap(1.5),
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
	},
	preProcedureChecklistTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	preProcedureChecklistItem: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(1),
	},
	preProcedureChecklistText: {
		flex: 1,
		fontSize: 13,
		lineHeight: 18,
		color: theme.colors.mutedForeground,
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
	rescheduleSlots: {
		gap: theme.gap(1.5),
	},
	recurringEditor: {
		gap: theme.gap(2),
	},
	evolutionForm: {
		gap: theme.gap(2),
	},
	evolutionField: {
		gap: theme.gap(1),
	},
	evolutionFieldLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		color: theme.colors.mutedForeground,
	},
	evolutionGrid: {
		gap: theme.gap(2),
	},
	evolutionInput: {
		minHeight: 44,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1.25),
		fontSize: 14,
		color: theme.colors.foreground,
	},
	evolutionHistory: {
		gap: theme.gap(1.5),
		paddingTop: theme.gap(1),
	},
	evolutionHistoryItem: {
		gap: theme.gap(0.75),
		padding: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.surfaceMuted,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	evolutionHistoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	evolutionHistoryDate: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	evolutionHistoryStatus: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
	},
	evolutionHistorySecondary: {
		fontSize: 13,
		lineHeight: 19,
		color: theme.colors.mutedForeground,
	},
	slotGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	timeSlot: {
		minWidth: 72,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfaceMuted,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1),
	},
	timeSlotSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primary,
	},
	timeSlotText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	timeSlotTextSelected: {
		color: theme.colors.primaryForeground,
	},
	rescheduleReasonInput: {
		minHeight: 96,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1.25),
		fontSize: 14,
		color: theme.colors.foreground,
		textAlignVertical: "top",
	},
	warningBox: {
		gap: theme.gap(0.5),
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfaceMuted,
		padding: theme.gap(1.5),
	},
	warningTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	warningText: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
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
