import { useRouter } from "expo-router";
import { Calendar, Plus, Search, SlidersHorizontal } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
	ActivityIndicator,
	Alert,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { AppointmentFiltersPanel } from "@/components/provider-appointments/appointment-filters-panel";
import { AppointmentTabs } from "@/components/provider-appointments/appointment-tabs";
import { ProviderAppointmentCard } from "@/components/provider-appointments/provider-appointment-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useAppointments,
	useUpdateAppointment,
} from "@/hooks/use-appointments";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import { readStoredJson, writeStoredJson } from "@/lib/json-storage";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { getAppointmentPatientName } from "@/utils/appointments";
import {
	defaultProviderAppointmentFilters,
	filterAppointmentsByTab,
	getActiveProviderAppointmentFilterCount,
	getFilteredProviderAppointments,
	getProviderAppointmentProcedureOptions,
	getProviderAppointmentStatusActions,
	getProviderAppointmentStatusConfig,
	type ProviderAppointmentFiltersForm,
	type ProviderAppointmentTab,
} from "@/utils/provider-appointment-filters";

const providerAppointmentTabLabels: Record<ProviderAppointmentTab, TranslationKey> =
	{
		upcoming: translationKeys.Upcoming,
		completed: translationKeys.Completed,
		cancelled: translationKeys.Cancelled,
	};

const providerAppointmentsFiltersStorageKey =
	"provider-appointments-bottom-sheet-filters";

export default function ProviderAppointments() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { healthcareProvider } = useAuth();
	const router = useRouter();
	const [activeTab, setActiveTab] =
		useState<ProviderAppointmentTab>("upcoming");
	const [isFiltersSheetVisible, setIsFiltersSheetVisible] = useState(false);
	const storedFiltersRef = useRef(
		readStoredJson<ProviderAppointmentFiltersForm>(
			providerAppointmentsFiltersStorageKey,
			defaultProviderAppointmentFilters,
		),
	);
	const filtersForm = useForm<ProviderAppointmentFiltersForm>({
		defaultValues: storedFiltersRef.current,
	});
	const filters = useWatch({ control: filtersForm.control });

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

	const normalizedFilters = useMemo(
		() => ({
			...defaultProviderAppointmentFilters,
			...filters,
		}),
		[filters],
	);

	const procedureOptions = useMemo(
		() => getProviderAppointmentProcedureOptions(appointments),
		[appointments],
	);

	const tabCounts = useMemo(
		() => ({
			upcoming: filterAppointmentsByTab(appointments, "upcoming").length,
			completed: filterAppointmentsByTab(appointments, "completed").length,
			cancelled: filterAppointmentsByTab(appointments, "cancelled").length,
		}),
		[appointments],
	);

	const filteredAppointments = useMemo(
		() =>
			getFilteredProviderAppointments({
				appointments,
				activeTab,
				filters: normalizedFilters,
			}),
		[activeTab, appointments, normalizedFilters],
	);

	const activeFilterCount =
		getActiveProviderAppointmentFilterCount(normalizedFilters);

	useEffect(() => {
		writeStoredJson(providerAppointmentsFiltersStorageKey, normalizedFilters);
	}, [normalizedFilters]);

	const handleTabChange = (tab: ProviderAppointmentTab) => {
		setActiveTab(tab);
		filtersForm.setValue("statusFilter", "ALL");
	};

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
				t("common.success"),
				t("common.appointmentUpdatedToStatus", {
					status: t(getProviderAppointmentStatusConfig(nextStatus).label),
				}),
			);
		} catch (updateError) {
			console.error("Failed to update appointment:", updateError);
			Alert.alert(t("common.error"), t("common.failedToUpdateAppointmentPleaseTryAgain"));
		}
	};

	const handleOpenChat = async (customerUserId: string) => {
		try {
			const result = await createConversationMutation.mutateAsync({
				participantId: customerUserId,
			});
			router.push(`/chat/${result.conversation.id}`);
		} catch (chatError) {
			console.error("Failed to open chat:", chatError);
			Alert.alert(t("common.error"), t("common.failedToOpenChat"));
		}
	};

	const openStatusMenu = (appointment: Appointment) => {
		const actions = getProviderAppointmentStatusActions(appointment);

		if (actions.length === 0) {
			Alert.alert(t("common.statusLocked"), t("common.thisAppointmentCanNoLongerBeUpdated"));
			return;
		}

		Alert.alert(
			t("common.updateStatus"),
			t("common.chooseTheNextStatusForPatientName", {
				patientName: getAppointmentPatientName(appointment),
			}),
			[
				...actions.map((action) => ({
					text: t(action.text),
					style: action.style,
					onPress: () => handleStatusUpdate(appointment.id, action.status),
				})),
				{ text: t("common.cancel"), style: "cancel" as const },
			],
		);
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
				<View style={styles.header}>
					<View style={styles.headerRow}>
						<View style={styles.headerCopy}>
							<Text style={styles.headerTitle}>{t("common.appointments")}</Text>
							<Text style={styles.headerSubtitle}>
								{t("common.manageYourAppointments")}
							</Text>
						</View>
						<View style={styles.headerActions}>
							<Button
								size="sm"
								style={styles.newAppointmentButton}
								testID="provider-appointments-new-button"
								onPress={() => router.push("/provider-create-appointment")}
							>
								<Plus
									size={16}
									color={theme.colors.primaryForeground}
									strokeWidth={2}
								/>
								<Text style={styles.newAppointmentText}>{t("common.new")}</Text>
							</Button>
						</View>
					</View>
					<Controller
						control={filtersForm.control}
						name="searchQuery"
						render={({ field }) => (
							<View style={styles.searchRow}>
								<Input
									leftIcon={Search}
									placeholder={t("common.searchByPatientPhoneEmailOrProcedure")}
									value={field.value}
									onChangeText={field.onChange}
									containerStyle={styles.searchInputContainer}
								/>
								<Button
									variant="outline"
									size="sm"
									style={styles.searchFilterButton}
									testID="provider-appointments-filter-button"
									accessibilityLabel={t("common.openAppointmentFilters")}
									onPress={() => setIsFiltersSheetVisible(true)}
								>
									<SlidersHorizontal
										size={16}
										color={
											activeFilterCount > 0
												? theme.colors.primary
												: theme.colors.foreground
										}
										strokeWidth={2}
									/>
									{activeFilterCount > 0 ? (
										<View style={styles.filterButtonBadge}>
											<Text style={styles.filterButtonBadgeText}>
												{activeFilterCount}
											</Text>
										</View>
									) : null}
								</Button>
							</View>
						)}
					/>
				</View>

				<AppointmentTabs
					activeTab={activeTab}
					counts={tabCounts}
					onChange={handleTabChange}
				/>

				<View style={styles.appointmentsSection}>
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
					) : filteredAppointments.length > 0 ? (
						<View style={styles.appointmentsList}>
							{filteredAppointments.map((appointment) => (
								<ProviderAppointmentCard
									key={appointment.id}
									appointment={appointment}
									onOpenChat={handleOpenChat}
									onViewDetails={(appointmentId) =>
										router.push(`/appointment/${appointmentId}`)
									}
									onUpdateStatus={openStatusMenu}
									isConversationPending={createConversationMutation.isPending}
									isStatusPending={updateAppointmentMutation.isPending}
								/>
							))}
						</View>
					) : (
						<View style={styles.emptyState}>
							<Calendar
								size={48}
								color={theme.colors.mutedForeground}
								style={styles.emptyIcon}
								strokeWidth={2}
							/>
							<Text style={styles.emptyStateText}>
								{activeFilterCount > 0
									? t("common.noAppointmentsFoundWithTheseFilters")
									: t("common.noTabAppointments", {
											tab: t(providerAppointmentTabLabels[activeTab]),
										})}
							</Text>
							{activeFilterCount > 0 ? (
								<Button
									variant="outline"
									size="sm"
									style={styles.emptyClearButton}
									onPress={() =>
										filtersForm.reset({
											...defaultProviderAppointmentFilters,
											searchQuery: normalizedFilters.searchQuery,
										})
									}
								>
									{t("common.clearFilters")}
								</Button>
							) : null}
						</View>
					)}
				</View>
			</ScrollView>

			<BottomSheet
				isOpen={isFiltersSheetVisible}
				onClose={() => setIsFiltersSheetVisible(false)}
				title={t("common.filters")}
				subtitle={t("common.showingFilteredCountOfTabCountAppointments", {
					filteredCount: String(filteredAppointments.length),
					tabCount: String(tabCounts[activeTab]),
				})}
				badgeCount={activeFilterCount}
			>
				<AppointmentFiltersPanel
					control={filtersForm.control}
					activeTab={activeTab}
					activeFilterCount={activeFilterCount}
					filteredCount={filteredAppointments.length}
					tabCount={tabCounts[activeTab]}
					procedureOptions={procedureOptions}
					onClearFilters={() =>
						filtersForm.reset({
							...defaultProviderAppointmentFilters,
							searchQuery: normalizedFilters.searchQuery,
						})
					}
					showHeader={false}
					showSearch={false}
					variant="sheet"
				/>
			</BottomSheet>
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
	headerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	searchRow: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		marginTop: theme.gap(2),
	},
	searchInputContainer: {
		flex: 1,
	},
	searchFilterButton: {
		width: 40,
		borderRadius: theme.radius.full,
		paddingHorizontal: 0,
		borderWidth: 1,
	},
	filterButtonBadge: {
		position: "absolute",
		top: -6,
		right: -6,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	filterButtonBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
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
	appointmentsSection: {
		paddingBottom: theme.gap(4),
	},
	appointmentsList: {
		gap: theme.gap(3),
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
	emptyIcon: {
		opacity: 0.5,
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
