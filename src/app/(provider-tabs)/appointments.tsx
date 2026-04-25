import { useRouter } from "expo-router";
import { Calendar, Clock, MessageCircle, Plus, Search } from "lucide-react-native";
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
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useAppointments,
	useUpdateAppointment,
} from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import {
	getAppointmentCustomerUserId,
	getAppointmentPatientImage,
	getAppointmentPatientName,
	getAppointmentPatientSubtitle,
} from "@/utils/appointments";

type TabType = "upcoming" | "completed" | "cancelled";

export default function ProviderAppointments() {
	const { theme } = useUnistyles();
	const { healthcareProvider } = useAuth();
	const router = useRouter();

	const [activeTab, setActiveTab] = useState<TabType>("upcoming");
	const [searchQuery, setSearchQuery] = useState("");

	// Fetch all appointments for this provider
	const {
		data: appointmentsData,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useAppointments(
		{ healthcareProviderId: healthcareProvider?.id || "" },
		!!healthcareProvider?.id,
	);

	const updateAppointmentMutation = useUpdateAppointment();
	const createConversationMutation = useGetOrCreateConversation();

	const appointments = appointmentsData?.appointments || [];

	// Format time from ISO string
	const formatTime = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	// Format date
	const formatDate = (isoString: string) => {
		const date = new Date(isoString);
		return date.toLocaleDateString("en-US", {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	};

	// Filter appointments by status based on active tab
	const getFilteredAppointmentsByTab = (
		appointments: Appointment[],
		tab: TabType,
	): Appointment[] => {
		switch (tab) {
			case "upcoming":
				return appointments.filter((apt) =>
					["SCHEDULED", "CONFIRMED", "IN_PROGRESS"].includes(apt.status),
				);
			case "completed":
				return appointments.filter((apt) => apt.status === "COMPLETED");
			case "cancelled":
				return appointments.filter((apt) =>
					["CANCELLED", "NO_SHOW"].includes(apt.status),
				);
			default:
				return appointments;
		}
	};

	// Filter by search query
	const getSearchFilteredAppointments = (
		appointments: Appointment[],
	): Appointment[] => {
		if (!searchQuery.trim()) return appointments;

		const query = searchQuery.toLowerCase().trim();
		return appointments.filter((apt) => {
			const patientName = getAppointmentPatientName(apt).toLowerCase();
			const procedures = apt.appointmentProcedures
				.map((ap) => ap.procedure.name.toLowerCase())
				.join(" ");
			return patientName.includes(query) || procedures.includes(query);
		});
	};

	// Get final filtered appointments
	const filteredAppointments = getSearchFilteredAppointments(
		getFilteredAppointmentsByTab(appointments, activeTab),
	);

	// Handle complete visit
	const handleStatusUpdate = async (
		appointmentId: string,
		nextStatus: AppointmentStatus,
	) => {
		try {
			await updateAppointmentMutation.mutateAsync({
				appointmentId,
				data: {
					status: nextStatus,
				},
			});
			Alert.alert(
				"Success",
				`Appointment updated to ${getStatusConfig(nextStatus).label}.`,
			);
		} catch (error) {
			console.error("Failed to update appointment:", error);
			Alert.alert("Error", "Failed to update appointment. Please try again.");
		}
	};

	// Handle open chat
	const handleOpenChat = async (customerUserId: string) => {
		try {
			const result = await createConversationMutation.mutateAsync({
				participantId: customerUserId,
			});
			router.push(`/chat/${result.conversation.id}`);
		} catch (error) {
			Alert.alert("Error", "Failed to open chat");
		}
	};

	// Get status badge config
	const getStatusConfig = (
		status: string,
	): {
		label: string;
		color: string;
		bgColor: string;
	} => {
		switch (status) {
			case "SCHEDULED":
				return {
					label: "Scheduled",
					color: "#3b82f6",
					bgColor: "#dbeafe",
				};
			case "CONFIRMED":
				return {
					label: "Confirmed",
					color: "#16a34a",
					bgColor: "#dcfce7",
				};
			case "IN_PROGRESS":
				return {
					label: "In Progress",
					color: "#d97706",
					bgColor: "#fef3c7",
				};
			case "COMPLETED":
				return {
					label: "Completed",
					color: "#6b7280",
					bgColor: "#f3f4f6",
				};
			case "CANCELLED":
				return {
					label: "Cancelled",
					color: "#dc2626",
					bgColor: "#fee2e2",
				};
			case "NO_SHOW":
				return {
					label: "No Show",
					color: "#dc2626",
					bgColor: "#fee2e2",
				};
			default:
				return {
					label: status,
					color: "#6b7280",
					bgColor: "#f3f4f6",
				};
		}
	};

	// Get action buttons based on status
	const getStatusActions = (appointment: Appointment) => {
		switch (appointment.status) {
			case "SCHEDULED":
				return [
					{ text: "Confirm", status: "CONFIRMED" as const },
					{ text: "Start Visit", status: "IN_PROGRESS" as const },
					{ text: "Mark No Show", status: "NO_SHOW" as const },
					{ text: "Cancel", status: "CANCELLED" as const, style: "destructive" as const },
				];
			case "CONFIRMED":
				return [
					{ text: "Start Visit", status: "IN_PROGRESS" as const },
					{ text: "Mark No Show", status: "NO_SHOW" as const },
					{ text: "Cancel", status: "CANCELLED" as const, style: "destructive" as const },
				];
			case "IN_PROGRESS":
				return [
					{ text: "Complete Visit", status: "COMPLETED" as const },
					{ text: "Cancel", status: "CANCELLED" as const, style: "destructive" as const },
				];
			default:
				return [];
		}
	};

	const openStatusMenu = (appointment: Appointment) => {
		const actions = getStatusActions(appointment);

		if (actions.length === 0) {
			Alert.alert("Status Locked", "This appointment can no longer be updated.");
			return;
		}

		Alert.alert(
			"Update Status",
			`Choose the next status for ${getAppointmentPatientName(appointment)}.`,
			[
				...actions.map((action) => ({
					text: action.text,
					style: action.style,
					onPress: () => handleStatusUpdate(appointment.id, action.status),
				})),
				{ text: "Cancel", style: "cancel" as const },
			],
		);
	};

	const getActionButtons = (appointment: Appointment) => {
		const customerUserId = getAppointmentCustomerUserId(appointment);

		return (
			<>
				{customerUserId ? (
					<Button
						variant="outline"
						size="sm"
						style={styles.actionButton}
						onPress={() => handleOpenChat(customerUserId)}
						disabled={createConversationMutation.isPending}
					>
						<MessageCircle
							size={16}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
						<Text style={{ marginLeft: theme.gap(1), fontSize: 14 }}>Chat</Text>
					</Button>
				) : null}
				<Button
					variant="outline"
					size="sm"
					style={styles.actionButton}
					onPress={() => router.push(`/appointment/${appointment.id}`)}
				>
					View Details
				</Button>
				{getStatusActions(appointment).length > 0 ? (
					<Button
						size="sm"
						style={styles.actionButton}
						onPress={() => openStatusMenu(appointment)}
						loading={updateAppointmentMutation.isPending}
						disabled={updateAppointmentMutation.isPending}
					>
						Update Status
					</Button>
				) : null}
			</>
		);
	};

	// Get count for each tab
	const getTabCount = (tab: TabType): number => {
		return getFilteredAppointmentsByTab(appointments, tab).length;
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
			>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.headerRow}>
						<View style={styles.headerCopy}>
							<Text style={styles.headerTitle}>Appointments</Text>
							<Text style={styles.headerSubtitle}>
								Manage your appointments
							</Text>
						</View>
						<Button
							size="sm"
							style={styles.newAppointmentButton}
							onPress={() => router.push("/provider-create-appointment")}
						>
							<Plus
								size={16}
								color={theme.colors.primaryForeground}
								strokeWidth={2}
							/>
							<Text style={styles.newAppointmentText}>New</Text>
						</Button>
					</View>
				</View>

				{/* Search Bar */}
				<Input
					leftIcon={Search}
					placeholder="Search by patient name or procedure..."
					value={searchQuery}
					onChangeText={setSearchQuery}
					containerStyle={styles.searchContainer}
				/>

				{/* Tabs */}
				<View style={styles.tabsContainer}>
					<Pressable
						style={[styles.tab, activeTab === "upcoming" && styles.tabActive]}
						onPress={() => setActiveTab("upcoming")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "upcoming" && styles.tabTextActive,
							]}
						>
							Upcoming
						</Text>
						{appointments.length > 0 && (
							<View
								style={[
									styles.tabBadge,
									activeTab === "upcoming" && styles.tabBadgeActive,
								]}
							>
								<Text
									style={[
										styles.tabBadgeText,
										activeTab === "upcoming" && styles.tabBadgeTextActive,
									]}
								>
									{getTabCount("upcoming")}
								</Text>
							</View>
						)}
					</Pressable>

					<Pressable
						style={[styles.tab, activeTab === "completed" && styles.tabActive]}
						onPress={() => setActiveTab("completed")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "completed" && styles.tabTextActive,
							]}
						>
							Completed
						</Text>
						{appointments.length > 0 && (
							<View
								style={[
									styles.tabBadge,
									activeTab === "completed" && styles.tabBadgeActive,
								]}
							>
								<Text
									style={[
										styles.tabBadgeText,
										activeTab === "completed" && styles.tabBadgeTextActive,
									]}
								>
									{getTabCount("completed")}
								</Text>
							</View>
						)}
					</Pressable>

					<Pressable
						style={[styles.tab, activeTab === "cancelled" && styles.tabActive]}
						onPress={() => setActiveTab("cancelled")}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "cancelled" && styles.tabTextActive,
							]}
						>
							Cancelled
						</Text>
						{appointments.length > 0 && (
							<View
								style={[
									styles.tabBadge,
									activeTab === "cancelled" && styles.tabBadgeActive,
								]}
							>
								<Text
									style={[
										styles.tabBadgeText,
										activeTab === "cancelled" && styles.tabBadgeTextActive,
									]}
								>
									{getTabCount("cancelled")}
								</Text>
							</View>
						)}
					</Pressable>
				</View>

				{/* Appointments List */}
				<View style={styles.appointmentsSection}>
					{isLoading ? (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={theme.colors.primary} />
							<Text style={styles.loadingText}>Loading appointments...</Text>
						</View>
					) : error ? (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>Failed to load appointments</Text>
							<Button onPress={() => refetch()} size="sm">
								Retry
							</Button>
						</View>
					) : filteredAppointments.length > 0 ? (
						<View style={styles.appointmentsList}>
							{filteredAppointments.map((appointment) => {
								const statusConfig = getStatusConfig(appointment.status);
								const isCancelledOrNoShow =
									appointment.status === "CANCELLED" ||
									appointment.status === "NO_SHOW";
								const patientName = getAppointmentPatientName(appointment);
								const patientSubtitle =
									getAppointmentPatientSubtitle(appointment);
								const patientImage = getAppointmentPatientImage(appointment);

								return (
									<View
										key={appointment.id}
										style={[
											styles.appointmentCard,
											isCancelledOrNoShow && styles.appointmentCardDisabled,
										]}
									>
										<View style={styles.appointmentContent}>
											{/* Avatar */}
											{patientImage ? (
												<Image
													source={{ uri: patientImage }}
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
														{patientName.charAt(0).toUpperCase()}
													</Text>
												</View>
											)}

											{/* Appointment Info */}
											<View style={styles.appointmentInfo}>
												<View style={styles.appointmentHeader}>
													<Text style={styles.appointmentPatientName}>
														{patientName}
													</Text>
												</View>
												<Text style={styles.appointmentPatientSubtitle}>
													{patientSubtitle}
												</Text>

												{/* Status Badge */}
												<View style={styles.statusBadgeContainer}>
													<View
														style={[
															styles.statusBadge,
															{ backgroundColor: statusConfig.bgColor },
														]}
													>
														<Text
															style={[
																styles.statusBadgeText,
																{ color: statusConfig.color },
															]}
														>
															{statusConfig.label}
														</Text>
													</View>
												</View>

												{/* Procedure */}
												<Text style={styles.appointmentProcedure}>
													{appointment.appointmentProcedures
														.map((ap) => ap.procedure.name)
														.join(", ") || "Appointment"}
												</Text>

												{/* Meta Info */}
												<View style={styles.appointmentMeta}>
													<View style={styles.appointmentMetaRow}>
														<Calendar
															size={12}
															color={theme.colors.mutedForeground}
															strokeWidth={2}
														/>
														<Text style={styles.appointmentMetaText}>
															{formatDate(appointment.scheduledAt)}
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
															{formatTime(appointment.scheduledAt)}
														</Text>
													</View>
													<Text style={styles.appointmentDot}>•</Text>
													<Text style={styles.appointmentDuration}>
														{appointment.totalDurationMinutes} min
													</Text>
												</View>
											</View>
										</View>

										{/* Action Buttons */}
										{getActionButtons(appointment) && (
											<View style={styles.appointmentActions}>
												{getActionButtons(appointment)}
											</View>
										)}
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
								{searchQuery
									? "No appointments found matching your search"
									: `No ${activeTab} appointments`}
							</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.gap(4),
	},
	header: {
		paddingTop: theme.gap(3),
		paddingBottom: theme.gap(3),
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	headerCopy: {
		flex: 1,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	headerSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	newAppointmentButton: {
		borderRadius: theme.radius.full,
		gap: theme.gap(0.75),
		paddingHorizontal: theme.gap(2),
	},
	newAppointmentText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	searchContainer: {
		marginBottom: theme.gap(3),
	},
	tabsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
		marginBottom: theme.gap(3),
	},
	tab: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: 50,
		backgroundColor: theme.colors.surfacePrimary,
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(0.5),
	},
	tabActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	tabText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
	},
	tabTextActive: {
		color: theme.colors.primaryForeground,
	},
	tabBadge: {
		backgroundColor: theme.colors.background,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(0.5),
		borderRadius: 10,
		minWidth: 22,
		alignItems: "center",
		justifyContent: "center",
	},
	tabBadgeActive: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
	},
	tabBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	tabBadgeTextActive: {
		color: theme.colors.primaryForeground,
	},
	appointmentsSection: {
		paddingBottom: theme.gap(4),
	},
	appointmentsList: {
		gap: theme.gap(3),
	},
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
	loadingContainer: {
		paddingVertical: theme.gap(8),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(3),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		paddingVertical: theme.gap(6),
		paddingHorizontal: theme.gap(4),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: 12,
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.destructive,
		marginBottom: theme.gap(3),
		textAlign: "center",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: theme.gap(8),
	},
	emptyStateText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(3),
		textAlign: "center",
	},
}));
