import { Search, SlidersHorizontal } from "lucide-react-native";
import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormReset } from "react-hook-form";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Input } from "@/components/ui/input";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { FilterChip } from "@/components/provider-appointments/filter-chip";
import {
	defaultProviderAppointmentFilters,
	getProviderAppointmentStatusConfig,
	providerAppointmentDateFilters,
	providerAppointmentPatientFilters,
	providerAppointmentSortOptions,
	providerAppointmentTabStatuses,
	type ProcedureFilterOption,
	type ProviderAppointmentFiltersForm,
	type ProviderAppointmentTab,
} from "@/utils/provider-appointment-filters";

type AppointmentFiltersPanelProps = {
	control: Control<ProviderAppointmentFiltersForm>;
	reset: UseFormReset<ProviderAppointmentFiltersForm>;
	activeTab: ProviderAppointmentTab;
	activeFilterCount: number;
	filteredCount: number;
	tabCount: number;
	procedureOptions: ProcedureFilterOption[];
	showHeader?: boolean;
	variant?: "card" | "sheet";
};

export function AppointmentFiltersPanel({
	control,
	reset,
	activeTab,
	activeFilterCount,
	filteredCount,
	tabCount,
	procedureOptions,
	showHeader = true,
	variant = "card",
}: AppointmentFiltersPanelProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const [dateFilter, customStartDate, customEndDate] = useWatch({
		control,
		name: ["dateFilter", "customStartDate", "customEndDate"],
	});

	return (
		<View
			style={[
				styles.filtersPanel,
				variant === "sheet" && styles.filtersPanelSheet,
			]}
		>
			{showHeader ? (
				<View style={styles.filtersHeader}>
					<View style={styles.filtersTitleRow}>
						<SlidersHorizontal
							size={18}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
						<Text style={styles.filtersTitle}>{t("common.filters")}</Text>
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
							{filteredCount} {t("common.of")} {tabCount}
						</Text>
					</View>
				</View>
			) : null}

			<Controller
				control={control}
				name="searchQuery"
				render={({ field }) => (
					<Input
						leftIcon={Search}
						placeholder={t("common.searchByPatientPhoneEmailOrProcedure")}
						value={field.value}
						onChangeText={field.onChange}
					/>
				)}
			/>

			<View style={styles.filterGroup}>
				<Text style={styles.filterLabel}>{t("common.date")}</Text>
				<Controller
					control={control}
					name="dateFilter"
					render={({ field }) => (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							{providerAppointmentDateFilters.map((filter) => (
								<FilterChip
									key={filter.value}
									label={t(filter.label)}
									selected={field.value === filter.value}
									onPress={() => field.onChange(filter.value)}
								/>
							))}
						</ScrollView>
					)}
				/>
				{dateFilter === "custom" ? (
					<View style={styles.customDateRow}>
						<Controller
							control={control}
							name="customStartDate"
							render={({ field }) => (
								<DatePickerInput
									placeholder="common.fromDate"
									title="common.selectStartDate"
									value={field.value}
									onChange={field.onChange}
									containerStyle={styles.customDateInput}
									maxDate={customEndDate || undefined}
									allowClear
								/>
							)}
						/>
						<Controller
							control={control}
							name="customEndDate"
							render={({ field }) => (
								<DatePickerInput
									placeholder="common.toDate"
									title="common.selectEndDate"
									value={field.value}
									onChange={field.onChange}
									containerStyle={styles.customDateInput}
									minDate={customStartDate || undefined}
									allowClear
								/>
							)}
						/>
					</View>
				) : null}
			</View>

			<View style={styles.filterGroup}>
				<Text style={styles.filterLabel}>{t("common.status")}</Text>
				<Controller
					control={control}
					name="statusFilter"
					render={({ field }) => (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							<FilterChip
								label={t("common.allStatuses")}
								selected={field.value === "ALL"}
								onPress={() => field.onChange("ALL")}
							/>
							{providerAppointmentTabStatuses[activeTab].map((status) => (
								<FilterChip
									key={status}
									label={t(getProviderAppointmentStatusConfig(status).label)}
									selected={field.value === status}
									onPress={() => field.onChange(status)}
								/>
							))}
						</ScrollView>
					)}
				/>
			</View>

			<View style={styles.filterGroup}>
				<Text style={styles.filterLabel}>{t("common.patient")}</Text>
				<Controller
					control={control}
					name="patientFilter"
					render={({ field }) => (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.filterChipsRow}
						>
							{providerAppointmentPatientFilters.map((filter) => (
								<FilterChip
									key={filter.value}
									label={t(filter.label)}
									selected={field.value === filter.value}
									onPress={() => field.onChange(filter.value)}
								/>
							))}
						</ScrollView>
					)}
				/>
			</View>

			{procedureOptions.length > 0 ? (
				<View style={styles.filterGroup}>
					<Text style={styles.filterLabel}>{t("common.procedure")}</Text>
					<Controller
						control={control}
						name="procedureFilter"
						render={({ field }) => (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.filterChipsRow}
							>
								<FilterChip
									label={t("common.allProcedures")}
									selected={field.value === "all"}
									onPress={() => field.onChange("all")}
								/>
								{procedureOptions.map((procedure) => (
									<FilterChip
										key={procedure.id}
										label={procedure.name}
										selected={field.value === procedure.id}
										onPress={() => field.onChange(procedure.id)}
									/>
								))}
							</ScrollView>
						)}
					/>
				</View>
			) : null}

			<View style={styles.filterFooter}>
				<View style={styles.sortGroup}>
					<Text style={styles.filterLabel}>{t("common.sort")}</Text>
					<Controller
						control={control}
						name="sortOrder"
						render={({ field }) => (
							<View style={styles.sortChips}>
								{providerAppointmentSortOptions.map((option) => (
									<FilterChip
										key={option.value}
										label={t(option.label)}
										selected={field.value === option.value}
										onPress={() => field.onChange(option.value)}
									/>
								))}
							</View>
						)}
					/>
				</View>
				{activeFilterCount > 0 ? (
					<Pressable
						style={styles.clearFiltersButton}
						onPress={() => reset(defaultProviderAppointmentFilters)}
					>
						<Text style={styles.clearFiltersText}>{t("common.clear")}</Text>
					</Pressable>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	filtersPanel: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		marginBottom: theme.gap(3),
		gap: theme.gap(2),
	},
	filtersPanelSheet: {
		backgroundColor: "transparent",
		borderRadius: 0,
		borderWidth: 0,
		padding: 0,
		marginBottom: 0,
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
}));
