import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Calendar,
	Clock,
	DollarSign,
	FileText,
	Mail,
	MessageCircle,
	Phone,
	Stethoscope,
	UserRound,
} from "lucide-react-native";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useAppointment, useUpdateAppointment } from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import type { Appointment, AppointmentStatus } from "@/types/appointment";

interface StatusAction {
	label: string;
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

const formatPrice = (priceInCents: number) => `$${(priceInCents / 100).toFixed(2)}`;

const getStatusConfig = (status: AppointmentStatus) => {
	switch (status) {
		case "SCHEDULED":
			return { label: "Scheduled", color: "#3b82f6", bgColor: "#dbeafe" };
		case "CONFIRMED":
			return { label: "Confirmed", color: "#16a34a", bgColor: "#dcfce7" };
		case "IN_PROGRESS":
			return { label: "In Progress", color: "#d97706", bgColor: "#fef3c7" };
		case "COMPLETED":
			return { label: "Completed", color: "#6b7280", bgColor: "#f3f4f6" };
		case "CANCELLED":
			return { label: "Cancelled", color: "#dc2626", bgColor: "#fee2e2" };
		case "NO_SHOW":
			return { label: "No Show", color: "#dc2626", bgColor: "#fee2e2" };
		default:
			return { label: status, color: "#6b7280", bgColor: "#f3f4f6" };
	}
};

const getProviderStatusActions = (
	status: AppointmentStatus,
): StatusAction[] => {
	switch (status) {
		case "SCHEDULED":
			return [
				{ label: "Confirm", status: "CONFIRMED", variant: "default" },
				{ label: "Start Visit", status: "IN_PROGRESS", variant: "outline" },
				{ label: "Mark No Show", status: "NO_SHOW", variant: "outline" },
				{ label: "Cancel", status: "CANCELLED", variant: "destructive" },
			];
		case "CONFIRMED":
			return [
				{ label: "Start Visit", status: "IN_PROGRESS", variant: "default" },
				{ label: "Mark No Show", status: "NO_SHOW", variant: "outline" },
				{ label: "Cancel", status: "CANCELLED", variant: "destructive" },
			];
		case "IN_PROGRESS":
			return [
				{ label: "Complete Visit", status: "COMPLETED", variant: "default" },
				{ label: "Cancel", status: "CANCELLED", variant: "destructive" },
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

export default function AppointmentDetails() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { isHealthcareProvider, isCustomer } = useAuth();

	const { data: appointmentData, isLoading, error } = useAppointment(id || "", !!id);
	const updateAppointmentMutation = useUpdateAppointment();
	const createConversationMutation = useGetOrCreateConversation();

	const appointment = appointmentData?.appointment;

	const handleStatusUpdate = async (appointmentId: string, nextStatus: AppointmentStatus) => {
		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: { status: nextStatus },
			});
			Alert.alert("Success", `Appointment updated to ${getStatusConfig(nextStatus).label}.`);
		} catch (updateError) {
			console.error("Failed to update appointment:", updateError);
			Alert.alert("Error", "Failed to update appointment status. Please try again.");
		}
	};

	const handleOpenChat = async (appointmentItem: Appointment) => {
		try {
			const participantId = isHealthcareProvider
				? appointmentItem.customer.user.id
				: appointmentItem.healthcareProvider.user.id;

			const result = await createConversationMutation.mutateAsync({
				participantId,
			});

			router.push(`/chat/${result.conversation.id}`);
		} catch (chatError) {
			console.error("Failed to open chat:", chatError);
			Alert.alert("Error", "Failed to open chat.");
		}
	};

	if (isLoading) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.stateText}>Loading appointment...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !appointment) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.centerState}>
					<Text style={styles.errorTitle}>Appointment not found</Text>
					<Button onPress={() => router.back()}>Back to Appointments</Button>
				</View>
			</SafeAreaView>
		);
	}

	const statusConfig = getStatusConfig(appointment.status);
	const procedures = appointment.appointmentProcedures.map((ap) => ap.procedure);
	const counterpart = isHealthcareProvider
		? {
				title: "Patient",
				name: appointment.customer.user.name,
				subtitle: "Customer",
				image: appointment.customer.user.image,
				email: appointment.customer.user.email,
				phone: appointment.customer.user.phone,
		  }
		: {
				title: "Provider",
				name: appointment.healthcareProvider.user.name,
				subtitle:
					appointment.healthcareProvider.specialty || "Healthcare provider",
				image: appointment.healthcareProvider.user.image,
				email: appointment.healthcareProvider.user.email,
				phone: appointment.healthcareProvider.user.phone,
		  };

	const providerActions = isHealthcareProvider
		? getProviderStatusActions(appointment.status)
		: [];

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<ArrowLeft size={22} color={theme.colors.foreground} strokeWidth={2} />
				</Pressable>
				<View style={styles.headerContent}>
					<Text style={styles.headerTitle}>Appointment Details</Text>
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
								{statusConfig.label}
							</Text>
						</View>
					</View>

					<View style={styles.detailGrid}>
						<DetailRow
							icon={Calendar}
							label="Date"
							value={formatDate(appointment.scheduledAt)}
						/>
						<DetailRow
							icon={Clock}
							label="Time"
							value={`${formatTime(appointment.scheduledAt)} • ${appointment.totalDurationMinutes} min`}
						/>
						<DetailRow
							icon={DollarSign}
							label="Total Price"
							value={formatPrice(appointment.totalPriceCents)}
						/>
						<DetailRow
							icon={Stethoscope}
							label="Procedures"
							value={procedures.map((procedure) => procedure.name).join(", ") || "Appointment"}
						/>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Contact</Text>
					<View style={styles.infoCard}>
						<DetailRow icon={Mail} label="Email" value={counterpart.email} />
						{counterpart.phone ? (
							<DetailRow icon={Phone} label="Phone" value={counterpart.phone} />
						) : null}
					</View>
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
								<Text style={styles.inlineButtonLabel}>Open Chat</Text>
							</View>
						</Button>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Procedures</Text>
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
					<Text style={styles.sectionTitle}>Notes</Text>
					<View style={styles.infoCard}>
						<View style={styles.notesHeader}>
							<FileText
								size={18}
								color={theme.colors.primary}
								strokeWidth={2}
							/>
							<Text style={styles.notesTitle}>
								{isHealthcareProvider ? "Appointment Notes" : "Provider Notes"}
							</Text>
						</View>
						<Text style={styles.notesText}>
							{appointment.notes?.trim() ||
								(isCustomer
									? "No notes were added to this appointment."
									: "No notes added yet for this appointment.")}
						</Text>
					</View>
				</View>

				{isHealthcareProvider && providerActions.length > 0 ? (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Update Status</Text>
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
									{action.label}
								</Button>
							))}
						</View>
					</View>
				) : null}

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Appointment Meta</Text>
					<View style={styles.infoCard}>
						<DetailRow icon={UserRound} label="Customer ID" value={appointment.customerId} />
						<DetailRow
							icon={UserRound}
							label="Provider ID"
							value={appointment.healthcareProviderId}
						/>
						<DetailRow
							icon={Calendar}
							label="Created"
							value={formatDate(appointment.createdAt)}
						/>
						<DetailRow
							icon={Calendar}
							label="Last Updated"
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
	statusActions: {
		gap: theme.gap(2),
	},
	statusActionButton: {
		width: "100%",
	},
}));
