import { useRouter } from "expo-router";
import {
	Calendar,
	Clock,
	MessageCircle,
	Plus,
	Search,
	SlidersHorizontal,
} from "lucide-react-native";
import { useMemo, useState } from "react";
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
type DateFilter = "all" | "today" | "tomorrow" | "next7" | "past" | "custom";
type PatientFilter = "all" | "account" | "third-party" | "unregistered";
type SortOrder = "soonest" | "latest";
type StatusFilter = "ALL" | AppointmentStatus;

const tabStatuses: Record<TabType, AppointmentStatus[]> = {
	upcoming: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"],
	completed: ["COMPLETED"],
	cancelled: ["CANCELLED", "NO_SHOW"],
};

const dateFilters: { label: string; value: DateFilter }[] = [
	{ label: "All dates", value: "all" },
	{ label: "Today", value: "today" },
	{ label: "Tomorrow", value: "tomorrow" },
	{ label: "Next 7 days", value: "next7" },
	{ label: "Past", value: "past" },
	{ label: "Custom", value: "custom" },
];

const patientFilters: { label: string; value: PatientFilter }[] = [
	{ label: "All patients", value: "all" },
	{ label: "Account holders", value: "account" },
	{ label: "Third-party", value: "third-party" },
	{ label: "No account", value: "unregistered" },
];

const sortOptions: { label: string; value: SortOrder }[] = [
	{ label: "Soonest", value: "soonest" },
	{ label: "Latest", value: "latest" },
];

const parseDateInput = (date: string, endOfDay = false) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		return null;
	}

	const [year, month, day] = date.split("-").map(Number);
	const parsed = new Date(year, (month || 1) - 1, day || 1);

	if (Number.isNaN(parsed.getTime())) {
		return null;
	}

	if (endOfDay) {
		parsed.setHours(23, 59, 59, 999);
	} else {
		parsed.setHours(0, 0, 0, 0);
	}

	return parsed;
};

const getDateRangeForFilter = (
	filter: DateFilter,
	customStartDate: string,
	customEndDate: string,
) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const sevenDaysFromNow = new Date(today);
	sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
	sevenDaysFromNow.setHours(23, 59, 59, 999);

	switch (filter) {
		case "today": {
			const end = new Date(today);
			end.setHours(23, 59, 59, 999);
			return { start: today, end };
		}
		case "tomorrow": {
			const end = new Date(tomorrow);
			end.setHours(23, 59, 59, 999);
			return { start: tomorrow, end };
		}
		case "next7":
			return { start: today, end: sevenDaysFromNow };
		case "past": {
			const end = new Date(today);
			end.setMilliseconds(end.getMilliseconds() - 1);
			return { start: null, end };
		}
		case "custom":
			return {
				start: customStartDate ? parseDateInput(customStartDate) : null,
				end: customEndDate ? parseDateInput(customEndDate, true) : null,
			};
		default:
			return { start: null, end: null };
	}
};

const getPatientFilterMatch = (
	appointment: Appointment,
	filter: PatientFilter,
) => {
	switch (filter) {
		case "account":
			return Boolean(appointment.customer) && !appointment.patientProfile;
		case "third-party":
			return Boolean(appointment.customer) && Boolean(appointment.patientProfile);
		case "unregistered":
			return !appointment.customer && Boolean(appointment.patientProfile);
		default:
			return true;
	}
};

export default function ProviderAppointments() {
	const { theme } = useUnistyles();
	const { healthcareProvider } = useAuth();
	const router = useRouter();

	const [activeTab, setActiveTab] = useState<TabType>("upcoming");
	const [searchQuery, setSearchQuery] = useState("");
	const [dateFilter, setDateFilter] = useState<DateFilter>("all");
	const [customStartDate, setCustomStartDate] = useState("");
	const [customEndDate, setCustomEndDate] = useState("");
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
	const [patientFilter, setPatientFilter] = useState<PatientFilter>("all");
	const [procedureFilter, setProcedureFilter] = useState("all");
	const [sortOrder, setSortOrder] = useState<SortOrder>("soonest");

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
	const procedureOptions = useMemo(() => {
		const procedureMap = new Map<string, string>();

		for (const appointment of appointments) {
			for (const appointmentProcedure of appointment.appointmentProcedures) {
				procedureMap.set(
					appointmentProcedure.procedure.id,
					appointmentProcedure.procedure.name,
				);
			}
		}

		return Array.from(procedureMap.entries())
			.map(([id, name]) => ({ id, name }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [appointments]);

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

	const getFilteredAppointmentsByTab = (tab: TabType): Appointment[] =>
		appointments.filter((apt) => tabStatuses[tab].includes(apt.status));

	const filteredAppointments = useMemo(() => {
		const query = searchQuery.toLowerCase().trim();
		const { start, end } = getDateRangeForFilter(
			dateFilter,
			customStartDate,
			customEndDate,
		);

		return getFilteredAppointmentsByTab(activeTab)
			.filter((appointment) => {
				if (!query) {
					return true;
				}

				const patientName = getAppointmentPatientName(appointment).toLowerCase();
				const patientPhone =
					appointment.patientProfile?.phone ||
					appointment.customer?.user.phone ||
					"";
				const patientEmail =
					appointment.patientProfile?.email ||
					appointment.customer?.user.email ||
					"";
				const procedures = appointment.appointmentProcedures
					.map((ap) => ap.procedure.name.toLowerCase())
					.join(" ");

				return (
					patientName.includes(query) ||
					patientPhone.toLowerCase().includes(query) ||
					patientEmail.toLowerCase().includes(query) ||
					procedures.includes(query)
				);
			})
			.filter((appointment) =>
				statusFilter === "ALL" ? true : appointment.status === statusFilter,
			)
			.filter((appointment) => {
				if (!start && !end) {
					return true;
				}

				const scheduledAt = new Date(appointment.scheduledAt);
				if (start && scheduledAt < start) {
					return false;
				}
				if (end && scheduledAt > end) {
					return false;
				}
				return true;
			})
			.filter((appointment) =>
				getPatientFilterMatch(appointment, patientFilter),
			)
			.filter((appointment) =>
				procedureFilter === "all"
					? true
					: appointment.appointmentProcedures.some(
							(ap) => ap.procedure.id === procedureFilter,
						),
			)
			.sort((a, b) => {
				const dateA = new Date(a.scheduledAt).getTime();
				const dateB = new Date(b.scheduledAt).getTime();
				return sortOrder === "soonest" ? dateA - dateB : dateB - dateA;
			});
	}, [
		activeTab,
		appointments,
		customEndDate,
		customStartDate,
		dateFilter,
		patientFilter,
		procedureFilter,
		searchQuery,
		sortOrder,
		statusFilter,
	]);

	const activeFilterCount = [
		searchQuery.trim(),
		dateFilter !== "all",
		statusFilter !== "ALL",
		patientFilter !== "all",
		procedureFilter !== "all",
		sortOrder !== "soonest",
	].filter(Boolean).length;

	const resetFilters = () => {
		setSearchQuery("");
		setDateFilter("all");
		setCustomStartDate("");
		setCustomEndDate("");
		setStatusFilter("ALL");
		setPatientFilter("all");
		setProcedureFilter("all");
		setSortOrder("soonest");
	};

	const handleTabChange = (tab: TabType) => {
		setActiveTab(tab);
		setStatusFilter("ALL");
	};

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
		return getFilteredAppointmentsByTab(tab).length;
	};

	const renderFilterChip = ({
		label,
		selected,
		onPress,
		chipKey,
	}: {
		label: string;
		selected: boolean;
		onPress: () => void;
		chipKey?: string;
	}) => (
		<Pressable
			key={chipKey}
			onPress={onPress}
			style={[styles.filterChip, selected && styles.filterChipActive]}
		>
			<Text
				style={[
					styles.filterChipText,
					selected && styles.filterChipTextActive,
				]}
				numberOfLines={1}
			>
				{label}
			</Text>
		</Pressable>
	);

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
						onPress={() => handleTabChange("upcoming")}
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
						onPress={() => handleTabChange("completed")}
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
						onPress={() => handleTabChange("cancelled")}
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

				{/* Filters */}
				<View style={styles.filtersPanel}>
					<View style={styles.filtersHeader}>
						<View style={styles.filtersTitleRow}>
							<SlidersHorizontal
								size={18}
								color={theme.colors.primary}
								strokeWidth={2}
							/>
							<Text style={styles.filtersTitle}>Filters</Text>
							{activeFilterCount > 0 ? (
								<View style={styles.activeFilterBadge}>
									<Text style={styles.activeFilterBadgeText}>
										{activeFilterCount}
									</Text>
								</View>
							) : null}
						</View>
						<View style={styles.resultsPill}>
							<Text style={styles.resultsPillText}>
								{filteredAppointments.length} of{" "}
								{getFilteredAppointmentsByTab(activeTab).length}
							</Text>
						</View>
					</View>

					<View style={styles.filterGroup}>
						<Text style={styles.filterLabel}>Date</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							{dateFilters.map((filter) =>
								renderFilterChip({
									label: filter.label,
									selected: dateFilter === filter.value,
									onPress: () => setDateFilter(filter.value),
									chipKey: filter.value,
								}),
							)}
						</ScrollView>
						{dateFilter === "custom" ? (
							<View style={styles.customDateRow}>
								<Input
									placeholder="From YYYY-MM-DD"
									value={customStartDate}
									onChangeText={setCustomStartDate}
									containerStyle={styles.customDateInput}
									keyboardType="numbers-and-punctuation"
								/>
								<Input
									placeholder="To YYYY-MM-DD"
									value={customEndDate}
									onChangeText={setCustomEndDate}
									containerStyle={styles.customDateInput}
									keyboardType="numbers-and-punctuation"
								/>
							</View>
						) : null}
					</View>

					<View style={styles.filterGroup}>
						<Text style={styles.filterLabel}>Status</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							{renderFilterChip({
								label: "All statuses",
								selected: statusFilter === "ALL",
								onPress: () => setStatusFilter("ALL"),
							})}
							{tabStatuses[activeTab].map((status) =>
								renderFilterChip({
									label: getStatusConfig(status).label,
									selected: statusFilter === status,
									onPress: () => setStatusFilter(status),
									chipKey: status,
								}),
							)}
						</ScrollView>
					</View>

					<View style={styles.filterGroup}>
						<Text style={styles.filterLabel}>Patient</Text>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							{patientFilters.map((filter) =>
								renderFilterChip({
									label: filter.label,
									selected: patientFilter === filter.value,
									onPress: () => setPatientFilter(filter.value),
									chipKey: filter.value,
								}),
							)}
						</ScrollView>
					</View>

					{procedureOptions.length > 0 ? (
						<View style={styles.filterGroup}>
							<Text style={styles.filterLabel}>Procedure</Text>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.filterChipsRow}
							>
								{renderFilterChip({
									label: "All procedures",
									selected: procedureFilter === "all",
									onPress: () => setProcedureFilter("all"),
								})}
								{procedureOptions.map((procedure) =>
									renderFilterChip({
										label: procedure.name,
										selected: procedureFilter === procedure.id,
										onPress: () => setProcedureFilter(procedure.id),
										chipKey: procedure.id,
									}),
								)}
							</ScrollView>
						</View>
					) : null}

					<View style={styles.filterFooter}>
						<View style={styles.sortGroup}>
							<Text style={styles.filterLabel}>Sort</Text>
							<View style={styles.sortChips}>
								{sortOptions.map((option) =>
									renderFilterChip({
										label: option.label,
										selected: sortOrder === option.value,
										onPress: () => setSortOrder(option.value),
										chipKey: option.value,
									}),
								)}
							</View>
						</View>
						{activeFilterCount > 0 ? (
							<Pressable
								style={styles.clearFiltersButton}
								onPress={resetFilters}
							>
								<Text style={styles.clearFiltersText}>Clear</Text>
							</Pressable>
						) : null}
					</View>
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
								{activeFilterCount > 0
									? "No appointments found with these filters"
									: `No ${activeTab} appointments`}
							</Text>
							{activeFilterCount > 0 ? (
								<Button
									variant="outline"
									size="sm"
									style={styles.emptyClearButton}
									onPress={resetFilters}
								>
									Clear Filters
								</Button>
							) : null}
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
	filtersPanel: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		marginBottom: theme.gap(3),
		gap: theme.gap(2),
	},
	filtersHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	filtersTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	filtersTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	activeFilterBadge: {
		minWidth: 22,
		height: 22,
		borderRadius: 11,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	activeFilterBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	resultsPill: {
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(0.75),
		borderRadius: theme.radius.full,
		backgroundColor: theme.colors.secondary,
	},
	resultsPillText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.secondaryForeground,
	},
	filterGroup: {
		gap: theme.gap(1),
	},
	filterLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		color: theme.colors.mutedForeground,
	},
	filterChipsRow: {
		gap: theme.gap(1),
		paddingRight: theme.gap(2),
	},
	filterChip: {
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(1.75),
		borderRadius: theme.radius.full,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	filterChipActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	filterChipText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	filterChipTextActive: {
		color: theme.colors.primaryForeground,
	},
	customDateRow: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	customDateInput: {
		flex: 1,
	},
	filterFooter: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	sortGroup: {
		flex: 1,
		gap: theme.gap(1),
	},
	sortChips: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	clearFiltersButton: {
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.radius.full,
		backgroundColor: theme.colors.secondary,
	},
	clearFiltersText: {
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.secondaryForeground,
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
	emptyClearButton: {
		marginTop: theme.gap(3),
		borderRadius: theme.radius.full,
	},
}));
