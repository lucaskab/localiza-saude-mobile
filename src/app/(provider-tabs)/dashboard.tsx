import { useRouter } from "expo-router";
import {
	Calendar,
	DollarSign,
	Clock,
	TrendingUp,
	CheckCircle,
	Users,
	CalendarClock,
} from "lucide-react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import {
	useProviderTodayAppointments,
	useUpdateAppointment,
} from "@/hooks/use-appointments";
import { useDashboard } from "@/hooks/use-dashboard";
import {
	getAppointmentPatientImage,
	getAppointmentPatientName,
} from "@/utils/appointments";
import { formatAverageRating } from "@/utils/ratings";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";

export default function ProviderDashboard() {
	const { theme } = useUnistyles();
	const { i18n, t } = useTranslation();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { user, healthcareProvider } = useAuth();

	// Fetch today's appointments
	const {
		data: appointmentsData,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useProviderTodayAppointments(
		healthcareProvider?.id || "",
		!!healthcareProvider?.id,
	);

	const appointments = appointmentsData?.appointments || [];

	// Fetch dashboard data
	const {
		data: dashboardData,
		isLoading: isDashboardLoading,
		refetch: refetchDashboard,
	} = useDashboard(healthcareProvider?.id || "", !!healthcareProvider?.id);

	// Update appointment mutation
	const updateAppointmentMutation = useUpdateAppointment();

	// Format time from ISO string to readable format
	const formatTime = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleTimeString(i18n.language, {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Transform appointments to UI format
	const todayAppointments = appointments.map((appointment) => ({
		id: appointment.id,
		patientName: getAppointmentPatientName(appointment),
		time: formatTime(appointment.scheduledAt),
		duration: appointment.totalDurationMinutes,
		procedure:
			appointment.appointmentProcedures
				.map((ap) => ap.procedure.name)
				.join(", ") || t("common.appointment"),
		status: appointment.status.toLowerCase(),
		avatar: getAppointmentPatientImage(appointment) || undefined,
	}));

	// Use dashboard data for stats
	const stats = [
		{
			label: translationKeys["Today's Appointments"],
			value: dashboardData?.todayAppointments.total.toString() || "0",
			icon: Calendar,
			color: theme.colors.primary,
		},
		{
			label: translationKeys["This Month"],
			value: dashboardData?.appointments.thisMonthTotal.toString() || "0",
			icon: CheckCircle,
			color: "#16a34a",
		},
		{
			label: translationKeys["Monthly Revenue"],
			value: `$${((dashboardData?.monthlyRevenue.currentMonth || 0) / 100).toFixed(0)}`,
			icon: DollarSign,
			color: "#2563eb",
		},
		{
			label: translationKeys["Avg. Rating"],
			value: formatAverageRating(dashboardData?.ratings.averageRating),
			icon: TrendingUp,
			color: "#d97706",
		},
		{
			label: translationKeys["Total Patients"],
			value: dashboardData?.patients.totalUnique.toString() || "0",
			icon: Users,
			color: "#8b5cf6",
		},
		{
			label: translationKeys.Upcoming,
			value: dashboardData?.appointments.upcomingCount.toString() || "0",
			icon: CalendarClock,
			color: "#06b6d4",
		},
	];

	const formatDate = () => {
		const today = new Date();
		return today.toLocaleDateString(i18n.language, {
			weekday: "long",
			month: "long",
			day: "numeric",
			year: "numeric",
		});
	};

	// Handle starting a visit
	const handleStartVisit = async (appointmentId: string) => {
		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: {
					status: "IN_PROGRESS",
				},
			});
			Alert.alert(t("common.success"), t("common.visitStartedSuccessfully"));
		} catch (error) {
			console.error("Failed to start visit:", error);
			Alert.alert(t("common.error"), t("common.failedToStartVisitPleaseTryAgain"), [
				{ text: "OK" },
			]);
		}
	};

	// Handle completing a visit
	const handleCompleteVisit = async (appointmentId: string) => {
		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: {
					status: "COMPLETED",
				},
			});
			Alert.alert(t("common.success"), t("common.visitCompletedSuccessfully"));
		} catch (error) {
			console.error("Failed to complete visit:", error);
			Alert.alert(t("common.error"), t("common.failedToCompleteVisitPleaseTryAgain"), [
				{ text: "OK" },
			]);
		}
	};

	// Get button config based on appointment status
	const getActionButtonConfig = (
		status: string,
	): {
		text: TranslationKey;
		disabled: boolean;
		variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
	} | null => {
		const upperStatus = status.toUpperCase();

		switch (upperStatus) {
			case "SCHEDULED":
			case "CONFIRMED":
				return {
					text: translationKeys["Start Visit"],
					disabled: false,
					variant: "default",
				};
			case "IN_PROGRESS":
				return {
					text: translationKeys["Complete Visit"],
					disabled: false,
					variant: "default",
				};
			case "COMPLETED":
				return {
					text: translationKeys.Completed,
					disabled: true,
					variant: "secondary",
				};
			case "CANCELLED":
			case "NO_SHOW":
				return null; // Don't show action button
			default:
				return {
					text: translationKeys["Start Visit"],
					disabled: false,
					variant: "default",
				};
		}
	};

	// Get status badge config
	const getStatusConfig = (
		status: string,
	): {
		label: TranslationKey;
		color: string;
		bgColor: string;
	} => {
		const upperStatus = status.toUpperCase();

		switch (upperStatus) {
			case "SCHEDULED":
				return {
					label: translationKeys.Scheduled,
					color: "#3b82f6",
					bgColor: "#dbeafe",
				};
			case "CONFIRMED":
				return {
					label: translationKeys.Confirmed,
					color: "#16a34a",
					bgColor: "#dcfce7",
				};
			case "IN_PROGRESS":
				return {
					label: translationKeys["In Progress"],
					color: "#d97706",
					bgColor: "#fef3c7",
				};
			case "COMPLETED":
				return {
					label: translationKeys.Completed,
					color: "#6b7280",
					bgColor: "#f3f4f6",
				};
			case "CANCELLED":
				return {
					label: translationKeys.Cancelled,
					color: "#dc2626",
					bgColor: "#fee2e2",
				};
			case "NO_SHOW":
				return {
					label: translationKeys["No Show"],
					color: "#dc2626",
					bgColor: "#fee2e2",
				};
			default:
				return {
					label: translationKeys.Status,
					color: "#6b7280",
					bgColor: "#f3f4f6",
				};
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching || isDashboardLoading}
						onRefresh={() => {
							refetch();
							refetchDashboard();
						}}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
			>
				{/* Header */}
				<View
					style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}
				>
					<View style={styles.headerTop}>
						<View>
							<Text style={styles.welcomeText}>{t("common.welcomeBack")}</Text>
							<Text style={styles.headerTitle}>{user?.name || "Doctor"}</Text>
						</View>
					</View>

					<View style={styles.dateContainer}>
						<Calendar
							size={16}
							color={theme.colors.primaryForeground}
							strokeWidth={2}
						/>
						<Text style={styles.dateText}>{t("common.today")}: {formatDate()}</Text>
					</View>
				</View>

				{/* Stats Grid */}
				<View style={styles.statsSection}>
					{isDashboardLoading ? (
						<View style={styles.statsLoadingContainer}>
							<ActivityIndicator size="small" color={theme.colors.primary} />
						</View>
					) : (
						<View style={styles.statsGrid}>
							{stats.map((stat) => {
								const Icon = stat.icon;
								return (
									<View key={stat.label} style={styles.statCard}>
										<Icon size={20} color={stat.color} strokeWidth={2} />
										<Text style={styles.statLabel}>{t(stat.label)}</Text>
										<Text style={styles.statValue}>{stat.value}</Text>
									</View>
								);
							})}
						</View>
					)}
				</View>

				{/* Today's Appointments */}
				<View style={styles.appointmentsSection}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>{t("common.todaySAppointments")}</Text>
						<Pressable
							onPress={() => router.push("/(provider-tabs)/appointments")}
						>
							<Text style={styles.viewAllButton}>{t("common.viewAll")}</Text>
						</Pressable>
					</View>

					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={theme.colors.primary} />
							<Text style={styles.loadingText}>{t("common.loadingAppointments")}</Text>
						</View>
					) : error ? (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>{t("common.failedToLoadAppointments")}</Text>
							<Button onPress={() => refetch()} size="sm">
								{t("common.retry")}
							</Button>
						</View>
					) : todayAppointments.length > 0 ? (
						<View style={styles.appointmentsList}>
							{todayAppointments.map((appointment) => {
								const isCancelledOrNoShow =
									appointment.status.toUpperCase() === "CANCELLED" ||
									appointment.status.toUpperCase() === "NO_SHOW";

								return (
									<View
										key={appointment.id}
										style={[
											styles.appointmentCard,
											isCancelledOrNoShow && styles.appointmentCardDisabled,
										]}
									>
										<View style={styles.appointmentContent}>
											{appointment.avatar ? (
												<Image
													source={{ uri: appointment.avatar }}
													style={styles.appointmentAvatar}
												/>
											) : (
												<View
													style={[
														styles.appointmentAvatar,
														styles.appointmentAvatarPlaceholder,
													]}
												>
													<Text style={styles.appointmentAvatarText}>
														{appointment.patientName.charAt(0).toUpperCase()}
													</Text>
												</View>
											)}
											<View style={styles.appointmentInfo}>
												<View style={styles.appointmentHeader}>
													<Text style={styles.appointmentPatientName}>
														{appointment.patientName}
													</Text>
												</View>
												<View style={styles.statusBadgeContainer}>
													<View
														style={[
															styles.statusBadge,
															{
																backgroundColor: getStatusConfig(
																	appointment.status,
																).bgColor,
															},
														]}
													>
														<Text
															style={[
																styles.statusBadgeText,
																{
																	color: getStatusConfig(appointment.status)
																		.color,
																},
															]}
														>
															{t(getStatusConfig(appointment.status).label)}
														</Text>
													</View>
												</View>
												<Text style={styles.appointmentProcedure}>
													{appointment.procedure}
												</Text>
												<View style={styles.appointmentMeta}>
													<View style={styles.appointmentTime}>
														<Clock
															size={12}
															color={theme.colors.mutedForeground}
															strokeWidth={2}
														/>
														<Text style={styles.appointmentTimeText}>
															{appointment.time}
														</Text>
													</View>
													<Text style={styles.appointmentDot}>•</Text>
													<Text style={styles.appointmentDuration}>
														{t("common.minutesCount", {
															count: appointment.duration,
														})}
													</Text>
												</View>
											</View>
										</View>
										<View style={styles.appointmentActions}>
											<Button
												variant="outline"
												size="sm"
												style={styles.appointmentButton}
												onPress={() =>
													router.push(`/appointment/${appointment.id}`)
												}
											>
												{t("common.viewDetails")}
											</Button>
											{(() => {
												const buttonConfig = getActionButtonConfig(
													appointment.status,
												);
												if (!buttonConfig) return null;

												return (
													<Button
														size="sm"
														style={styles.appointmentButton}
														onPress={() => {
															if (buttonConfig.text === translationKeys["Start Visit"]) {
																handleStartVisit(appointment.id);
															} else if (
																buttonConfig.text === translationKeys["Complete Visit"]
															) {
																handleCompleteVisit(appointment.id);
															}
														}}
														disabled={
															buttonConfig.disabled ||
															updateAppointmentMutation.isPending
														}
														loading={updateAppointmentMutation.isPending}
														variant={buttonConfig.variant}
													>
														{t(buttonConfig.text)}
													</Button>
												);
											})()}
										</View>
									</View>
								);
							})}
						</View>
					) : (
						<View style={styles.emptyState}>
							<Calendar
								size={48}
								color={theme.colors.mutedForeground}
								style={{ opacity: 0.5 }}
								strokeWidth={2}
							/>
							<Text style={styles.emptyStateText}>
								{t("common.noAppointmentsScheduledForToday")}
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(4),
		borderBottomLeftRadius: theme.radius.xl,
		borderBottomRightRadius: theme.radius.xl,
	},
	headerTop: {
		marginBottom: theme.gap(3),
	},
	welcomeText: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginBottom: theme.gap(0.5),
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
	},
	dateContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	dateText: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
	},
	statsSection: {
		paddingVertical: theme.gap(3),
		paddingHorizontal: theme.gap(3),
	},
	statsLoadingContainer: {
		paddingVertical: theme.gap(4),
		alignItems: "center",
		justifyContent: "center",
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(2),
	},
	statCard: {
		flex: 1,
		minWidth: "45%",
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	statLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(1),
		marginBottom: theme.gap(0.5),
	},
	statValue: {
		fontSize: 24,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	appointmentsSection: {
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(3),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(2),
	},
	viewAllButton: {
		fontSize: 14,
		color: theme.colors.primary,
		fontWeight: "500",
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
	},
	appointmentCardDisabled: {
		opacity: 0.6,
		backgroundColor: theme.colors.surfaceMuted,
	},
	appointmentContent: {
		flexDirection: "row",
		gap: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	appointmentAvatar: {
		width: 48,
		height: 48,
		borderRadius: theme.radius.full,
	},
	appointmentInfo: {
		flex: 1,
	},
	appointmentHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(1),
	},
	appointmentPatientName: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	appointmentProcedure: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(1),
	},
	appointmentMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	appointmentTime: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	appointmentTimeText: {
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
	statusBadgeContainer: {
		marginBottom: theme.gap(1),
	},
	statusBadge: {
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(0.5),
		borderRadius: theme.radius.full,
		alignSelf: "flex-start",
	},
	statusBadgeText: {
		fontSize: 11,
		fontWeight: "600",
		textTransform: "capitalize",
	},
	appointmentActions: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		paddingTop: theme.gap(2),
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	appointmentButton: {
		flex: 1,
		borderRadius: theme.radius.full,
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: theme.gap(6),
	},
	emptyStateText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(2),
	},
	appointmentAvatarPlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	appointmentAvatarText: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	loadingContainer: {
		paddingVertical: theme.gap(6),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		paddingVertical: theme.gap(4),
		paddingHorizontal: theme.gap(3),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.xl,
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.destructive,
		marginBottom: theme.gap(2),
		textAlign: "center",
	},
}));
