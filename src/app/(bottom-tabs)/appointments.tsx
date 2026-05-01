import { useRouter } from "expo-router";
import {
	Calendar,
	Clock,
	MapPin,
	MessageCircle,
	Phone,
	Video,
} from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useAppointmentsByCustomer } from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import type { Appointment } from "@/types/appointment";
import { getAppointmentPatientName } from "@/utils/appointments";

export default function Appointments() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const { i18n, t } = useTranslation();
	const { customer, isCustomer } = useAuth();

	const createConversationMutation = useGetOrCreateConversation();
	const [activeTab, setActiveTab] = useState<"upcoming" | "completed">(
		"upcoming",
	);

	// Fetch appointments using customer ID from auth context
	const {
		data: appointmentsData,
		isLoading: isLoadingAppointments,
		error: appointmentsError,
		refetch,
	} = useAppointmentsByCustomer(customer?.id || "", !!customer?.id);

	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		await refetch();
		setIsRefreshing(false);
	};

	// Filter appointments based on status
	const filteredAppointments = (appointmentsData?.appointments || []).filter(
		(appointment) => {
			if (activeTab === "upcoming") {
				return (
					appointment.status === "SCHEDULED" ||
					appointment.status === "CONFIRMED" ||
					appointment.status === "IN_PROGRESS"
				);
			}
			return appointment.status === "COMPLETED";
		},
	);

	// Format date and time
	const formatDateTime = (dateString: string) => {
		const date = new Date(dateString);
		const formattedDate = date.toLocaleDateString(i18n.language, {
			month: "long",
			day: "numeric",
			year: "numeric",
		});
		const formattedTime = date.toLocaleTimeString(i18n.language, {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
		return { date: formattedDate, time: formattedTime };
	};

	// Format price
	const formatPrice = (priceInCents: number) => {
		return `$${(priceInCents / 100).toFixed(2)}`;
	};

	const handleOpenChat = async (providerUserId: string) => {
		try {
			const result = await createConversationMutation.mutateAsync({
				participantId: providerUserId,
			});
			router.push(`/chat/${result.conversation.id}`);
		} catch (error) {
			Alert.alert(t("common.error"), t("common.failedToOpenChat"));
		}
	};

	// Get status badge
	const getStatusBadge = (appointment: Appointment) => {
		switch (appointment.status) {
			case "SCHEDULED":
				return (
					<Badge variant="accent" style={styles.badge}>
						{t("common.scheduled")}
					</Badge>
				);
			case "CONFIRMED":
				return (
					<Badge variant="default" style={styles.badge}>
						{t("common.confirmed")}
					</Badge>
				);
			case "IN_PROGRESS":
				return (
					<Badge variant="default" style={styles.badge}>
						{t("common.inProgress")}
					</Badge>
				);
			default:
				return null;
		}
	};

	// Show message if user is not a customer
	if (!isCustomer) {
		return (
			<View style={styles.container}>
				<View style={styles.centerContainer}>
					<Calendar
						size={64}
						color={theme.colors.mutedForeground}
						strokeWidth={1.5}
						style={styles.emptyIcon}
					/>
					<Text style={styles.emptyTitle}>{t("common.notAvailable")}</Text>
					<Text style={styles.emptyText}>
						{t("common.appointmentsAreOnlyAvailableForCustomerAccounts")}
					</Text>
				</View>
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>{t("common.myAppointments")}</Text>

				{/* Tabs */}
				<View style={styles.tabsContainer}>
					<Pressable
						onPress={() => setActiveTab("upcoming")}
						style={[
							styles.tab,
							activeTab === "upcoming" ? styles.tabActive : styles.tabInactive,
						]}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "upcoming"
									? styles.tabTextActive
									: styles.tabTextInactive,
							]}
						>
							{t("common.upcoming")}
						</Text>
					</Pressable>
					<Pressable
						onPress={() => setActiveTab("completed")}
						style={[
							styles.tab,
							activeTab === "completed" ? styles.tabActive : styles.tabInactive,
						]}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "completed"
									? styles.tabTextActive
									: styles.tabTextInactive,
							]}
						>
							{t("common.completed")}
						</Text>
					</Pressable>
				</View>
			</View>

			{/* Content */}
			<ScrollView
				style={styles.listContainer}
				contentContainerStyle={
					filteredAppointments.length === 0 ||
					isLoadingAppointments ||
					appointmentsError
						? styles.scrollContentEmpty
						: styles.scrollContent
				}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
			>
				{isLoadingAppointments ? (
					<View style={styles.centerContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>{t("common.loadingAppointments")}</Text>
					</View>
				) : appointmentsError ? (
					<View style={styles.centerContainer}>
						<Calendar
							size={64}
							color={theme.colors.destructive}
							strokeWidth={1.5}
							style={styles.emptyIcon}
						/>
						<Text style={styles.errorTitle}>{t("common.errorLoadingAppointments")}</Text>
						<Text style={styles.errorText}>
							{t("common.pleaseTryAgainLaterOrPullToRefresh")}
						</Text>
						<Button
							variant="outline"
							size="sm"
							onPress={handleRefresh}
							style={{ marginTop: theme.gap(2) }}
						>
							{t("common.retry")}
						</Button>
					</View>
				) : filteredAppointments.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Calendar
							size={64}
							color={theme.colors.mutedForeground}
							strokeWidth={1.5}
							style={styles.emptyIcon}
						/>
						<Text style={styles.emptyTitle}>
							{activeTab === "upcoming"
								? t("common.noUpcomingAppointments")
								: t("common.noCompletedAppointments")}
						</Text>
						<Text style={styles.emptyText}>
							{activeTab === "upcoming"
								? t("common.youDontHaveAnyScheduledAppointmentsFindAHealthcareProviderToGetStarted")
								: t("common.youHaventCompletedAnyAppointmentsYetYourAppointmentHistoryWillAppearHere")}
						</Text>
					</View>
				) : (
					<View style={styles.appointmentsList}>
						{filteredAppointments.map((appointment) => {
							const { date, time } = formatDateTime(appointment.scheduledAt);
							const provider = appointment.healthcareProvider;
							const providerUser = provider.user;
							const patientName = getAppointmentPatientName(appointment);

							return (
								<Pressable
									key={appointment.id}
									style={({ pressed }) => [
										styles.appointmentCard,
										pressed && styles.appointmentCardPressed,
									]}
									onPress={() => router.push(`/appointment/${appointment.id}`)}
									android_ripple={{
										color: theme.colors.primary,
										borderless: false,
									}}
								>
									{/* Status Badge */}
									{activeTab === "upcoming" && getStatusBadge(appointment)}

									{/* Professional Info */}
									<View style={styles.professionalInfo}>
										{providerUser.image ? (
											<Image
												source={{ uri: providerUser.image }}
												style={styles.professionalImage}
											/>
										) : (
											<View
												style={[
													styles.professionalImage,
													styles.professionalImagePlaceholder,
												]}
											>
												<Text style={styles.professionalImageInitial}>
													{providerUser.name.charAt(0).toUpperCase()}
												</Text>
											</View>
										)}
										<View style={styles.professionalDetails}>
											<Text style={styles.professionalName}>
												{providerUser.name}
											</Text>
											{provider.specialty && (
												<Text style={styles.professionalSpecialty}>
													{provider.specialty}
												</Text>
											)}
											<Text style={styles.appointmentType}>
												{appointment.appointmentProcedures.length > 0
													? appointment.appointmentProcedures
															.map((ap) => ap.procedure.name)
															.join(", ")
													: t("common.consultation")}
											</Text>
											{appointment.patientProfile ? (
												<Text style={styles.patientForText}>
													{t("common.forPatientName", { patientName })}
												</Text>
											) : null}
										</View>
									</View>

									{/* Appointment Details */}
									<View style={styles.detailsContainer}>
										<View style={styles.detailRow}>
											<Calendar
												size={16}
												color={theme.colors.primary}
												strokeWidth={2}
											/>
											<Text style={styles.detailText}>{date}</Text>
										</View>
										<View style={styles.detailRow}>
											<Clock
												size={16}
												color={theme.colors.primary}
												strokeWidth={2}
											/>
											<Text style={styles.detailText}>
												{time} ({appointment.totalDurationMinutes} min)
											</Text>
										</View>
										<View style={styles.detailRow}>
											<MapPin
												size={16}
												color={theme.colors.primary}
												strokeWidth={2}
											/>
											<Text style={styles.detailText}>
												{formatPrice(appointment.totalPriceCents)}
											</Text>
										</View>
									</View>

									{/* Notes */}
									{appointment.notes && (
										<View style={styles.notesContainer}>
											<Text style={styles.notesLabel}>{t("common.notes2")}</Text>
											<Text style={styles.notesText}>{appointment.notes}</Text>
										</View>
									)}

									{/* Actions */}
									{activeTab === "upcoming" && (
										<View style={styles.actionsContainer}>
											<Button
												variant="outline"
												size="sm"
												style={styles.actionButton}
												onPress={() =>
													handleOpenChat(appointment.healthcareProvider.user.id)
												}
												disabled={createConversationMutation.isPending}
											>
												<View style={styles.iconButton}>
													<MessageCircle
														size={16}
														color={theme.colors.foreground}
														strokeWidth={2}
													/>
													<Text style={styles.detailText}>{t("common.chat")}</Text>
												</View>
											</Button>
											{providerUser.phone && (
												<Button
													variant="outline"
													size="sm"
													style={styles.actionButton}
												>
													<View style={styles.iconButton}>
														<Phone
															size={16}
															color={theme.colors.foreground}
															strokeWidth={2}
														/>
														<Text style={styles.detailText}>{t("common.call")}</Text>
													</View>
												</Button>
											)}
											<Button
												size="sm"
												style={styles.actionButton}
												onPress={() =>
													router.push(`/appointment/${appointment.id}`)
												}
											>
												<View style={styles.iconButton}>
													<Video
														size={16}
														color={theme.colors.primaryForeground}
														strokeWidth={2}
													/>
													<Text
														style={[
															styles.detailText,
															{ color: theme.colors.primaryForeground },
														]}
													>
														{t("common.details")}
													</Text>
												</View>
											</Button>
										</View>
									)}

									{activeTab === "completed" && (
										<View style={styles.actionsContainer}>
											<Button
												variant="outline"
												size="sm"
												style={styles.actionButton}
												onPress={() =>
													handleOpenChat(appointment.healthcareProvider.user.id)
												}
												disabled={createConversationMutation.isPending}
											>
												<View style={styles.iconButton}>
													<MessageCircle
														size={16}
														color={theme.colors.foreground}
														strokeWidth={2}
													/>
													<Text style={styles.detailText}>{t("common.chat")}</Text>
												</View>
											</Button>
											<Button
												variant="outline"
												size="sm"
												style={styles.actionButton}
											>
												{t("common.bookAgain")}
											</Button>
										</View>
									)}
								</Pressable>
							);
						})}
					</View>
				)}
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
		backgroundColor: theme.colors.surfacePrimary,
		paddingTop: theme.gap(3),
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	tabsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	tab: {
		flex: 1,
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.radius.lg,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: theme.colors.primary,
	},
	tabInactive: {
		backgroundColor: theme.colors.secondary,
	},
	tabText: {
		fontSize: 14,
		fontWeight: "500",
	},
	tabTextActive: {
		color: theme.colors.primaryForeground,
	},
	tabTextInactive: {
		color: theme.colors.secondaryForeground,
	},
	listContainer: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(3),
	},
	scrollContentEmpty: {
		flexGrow: 1,
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(3),
	},
	centerContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(8),
	},
	loadingText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(2),
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.destructive,
		marginBottom: theme.gap(1),
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		paddingHorizontal: theme.gap(4),
		marginBottom: theme.gap(1),
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(8),
	},
	emptyIcon: {
		marginBottom: theme.gap(2),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		paddingHorizontal: theme.gap(4),
		lineHeight: 20,
	},
	appointmentsList: {
		gap: theme.gap(2),
	},
	appointmentCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		gap: theme.gap(2),
	},
	appointmentCardPressed: {
		opacity: 0.7,
		backgroundColor: theme.colors.surfaceSecondary,
	},
	badge: {
		marginBottom: theme.gap(1.5),
	},
	professionalInfo: {
		flexDirection: "row",
		gap: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	professionalImage: {
		width: 64,
		height: 64,
		borderRadius: theme.radius.lg,
	},
	professionalImagePlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	professionalImageInitial: {
		fontSize: 24,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	professionalDetails: {
		flex: 1,
		justifyContent: "center",
	},
	professionalName: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(0.5),
	},
	professionalSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	appointmentType: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	patientForText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: "600",
		marginTop: theme.gap(0.5),
	},
	detailsContainer: {
		backgroundColor: `${theme.colors.secondary}80`,
		borderRadius: theme.radius.lg,
		padding: theme.gap(1.5),
		gap: theme.gap(1),
		marginBottom: theme.gap(2),
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	detailText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	notesContainer: {
		backgroundColor: `${theme.colors.muted}80`,
		borderRadius: theme.radius.lg,
		padding: theme.gap(1.5),
		marginBottom: theme.gap(2),
	},
	notesLabel: {
		fontSize: 12,
		fontWeight: "500",
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	notesText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	actionsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	actionButton: {
		flex: 1,
	},
	iconButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	fullWidthButton: {
		width: "100%",
	},
}));
