import { Calendar, Clock, MessageCircle } from "lucide-react-native";
import { Image, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/appointment";
import {
	getAppointmentCustomerUserId,
	getAppointmentPatientImage,
	getAppointmentPatientName,
	getAppointmentPatientSubtitle,
} from "@/utils/appointments";
import {
	formatProviderAppointmentDate,
	formatProviderAppointmentTime,
	getProviderAppointmentStatusActions,
	getProviderAppointmentStatusConfig,
} from "@/utils/provider-appointment-filters";

type ProviderAppointmentCardProps = {
	appointment: Appointment;
	onOpenChat: (customerUserId: string) => void;
	onViewDetails: (appointmentId: string) => void;
	onUpdateStatus: (appointment: Appointment) => void;
	isConversationPending: boolean;
	isStatusPending: boolean;
};

export function ProviderAppointmentCard({
	appointment,
	onOpenChat,
	onViewDetails,
	onUpdateStatus,
	isConversationPending,
	isStatusPending,
}: ProviderAppointmentCardProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const statusConfig = getProviderAppointmentStatusConfig(appointment.status);
	const isCancelledOrNoShow =
		appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";
	const patientName = getAppointmentPatientName(appointment);
	const patientSubtitle = getAppointmentPatientSubtitle(appointment);
	const patientImage = getAppointmentPatientImage(appointment);
	const customerUserId = getAppointmentCustomerUserId(appointment);
	const statusActions = getProviderAppointmentStatusActions(appointment);

	return (
		<View
			style={[
				styles.appointmentCard,
				isCancelledOrNoShow && styles.appointmentCardDisabled,
			]}
		>
			<View style={styles.appointmentContent}>
				{patientImage ? (
					<Image source={{ uri: patientImage }} style={styles.appointmentAvatar} />
				) : (
					<View
						style={[
							styles.appointmentAvatar,
							styles.appointmentAvatarPlaceholder,
						]}
					>
						<Text style={styles.appointmentAvatarText}>
							{patientName.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View style={styles.appointmentInfo}>
					<View style={styles.appointmentHeader}>
						<Text style={styles.appointmentPatientName}>{patientName}</Text>
					</View>
					<Text style={styles.appointmentPatientSubtitle}>
						{patientSubtitle}
					</Text>

					<View style={styles.statusBadgeContainer}>
						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: statusConfig.bgColor },
							]}
						>
							<Text
								style={[styles.statusBadgeText, { color: statusConfig.color }]}
							>
								{t(statusConfig.label)}
							</Text>
						</View>
					</View>

					<Text style={styles.appointmentProcedure}>
						{appointment.appointmentProcedures
							.map((ap) => ap.procedure.name)
							.join(", ") || t("common.appointment")}
					</Text>

					<View style={styles.appointmentMeta}>
						<View style={styles.appointmentMetaRow}>
							<Calendar
								size={12}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
							<Text style={styles.appointmentMetaText}>
								{formatProviderAppointmentDate(appointment.scheduledAt)}
							</Text>
						</View>
						<Text style={styles.appointmentDot}>•</Text>
						<View style={styles.appointmentMetaRow}>
							<Clock
								size={12}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
							<Text style={styles.appointmentMetaText}>
								{formatProviderAppointmentTime(appointment.scheduledAt)}
							</Text>
						</View>
						<Text style={styles.appointmentDot}>•</Text>
						<Text style={styles.appointmentDuration}>
							{appointment.totalDurationMinutes} min
						</Text>
					</View>
				</View>
			</View>

			<View style={styles.appointmentActions}>
				{customerUserId ? (
					<Button
						variant="outline"
						size="sm"
						style={styles.actionButton}
						onPress={() => onOpenChat(customerUserId)}
						disabled={isConversationPending}
					>
						<MessageCircle
							size={16}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
						<Text style={styles.chatButtonText}>{t("common.chat")}</Text>
					</Button>
				) : null}
				<Button
					variant="outline"
					size="sm"
					style={styles.actionButton}
					onPress={() => onViewDetails(appointment.id)}
				>
					{t("common.viewDetails")}
				</Button>
				{statusActions.length > 0 ? (
					<Button
						size="sm"
						style={styles.actionButton}
						onPress={() => onUpdateStatus(appointment)}
						loading={isStatusPending}
						disabled={isStatusPending}
					>
						{t("common.updateStatus")}
					</Button>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	appointmentCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: 12,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	appointmentCardDisabled: {
		opacity: 0.6,
		backgroundColor: theme.colors.surfaceSecondary,
	},
	appointmentContent: {
		flexDirection: "row",
		gap: theme.gap(3),
	},
	appointmentAvatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	appointmentAvatarPlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	appointmentAvatarText: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	appointmentInfo: {
		flex: 1,
	},
	appointmentHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(1.5),
	},
	appointmentPatientName: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	appointmentPatientSubtitle: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(1),
	},
	statusBadgeContainer: {
		marginBottom: theme.gap(1.5),
	},
	statusBadge: {
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1),
		borderRadius: 6,
		alignSelf: "flex-start",
	},
	statusBadgeText: {
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	appointmentProcedure: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(2),
	},
	appointmentMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		flexWrap: "wrap",
	},
	appointmentMetaRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	appointmentMetaText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	appointmentDot: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	appointmentDuration: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	appointmentActions: {
		flexDirection: "row",
		gap: theme.gap(2),
		marginTop: theme.gap(3),
		paddingTop: theme.gap(3),
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	actionButton: {
		flex: 1,
	},
	chatButtonText: {
		marginLeft: theme.gap(1),
		fontSize: 14,
	},
}));
