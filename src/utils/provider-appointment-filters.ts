import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { translationKeys, type TranslationKey } from "@/i18n/key-map";
import { getAppointmentPatientName } from "@/utils/appointments";

export type ProviderAppointmentTab = "upcoming" | "completed" | "cancelled";
export type ProviderAppointmentDateFilter =
	| "all"
	| "today"
	| "tomorrow"
	| "next7"
	| "past"
	| "custom";
export type ProviderAppointmentPatientFilter =
	| "all"
	| "account"
	| "third-party"
	| "unregistered";
export type ProviderAppointmentSortOrder = "soonest" | "latest";
export type ProviderAppointmentStatusFilter = "ALL" | AppointmentStatus;

export type ProviderAppointmentFiltersForm = {
	searchQuery: string;
	dateFilter: ProviderAppointmentDateFilter;
	customStartDate: string;
	customEndDate: string;
	statusFilter: ProviderAppointmentStatusFilter;
	patientFilter: ProviderAppointmentPatientFilter;
	procedureFilter: string;
	sortOrder: ProviderAppointmentSortOrder;
};

export type ProcedureFilterOption = {
	id: string;
	name: string;
};

export const defaultProviderAppointmentFilters: ProviderAppointmentFiltersForm = {
	searchQuery: "",
	dateFilter: "all",
	customStartDate: "",
	customEndDate: "",
	statusFilter: "ALL",
	patientFilter: "all",
	procedureFilter: "all",
	sortOrder: "soonest",
};

export const providerAppointmentTabStatuses: Record<
	ProviderAppointmentTab,
	AppointmentStatus[]
> = {
	upcoming: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"],
	completed: ["COMPLETED"],
	cancelled: ["CANCELLED", "NO_SHOW"],
};

export const providerAppointmentDateFilters: {
	label: TranslationKey;
	value: ProviderAppointmentDateFilter;
}[] = [
	{ label: translationKeys["All dates"], value: "all" },
	{ label: translationKeys.Today, value: "today" },
	{ label: translationKeys.Tomorrow, value: "tomorrow" },
	{ label: translationKeys["Next 7 days"], value: "next7" },
	{ label: translationKeys.Past, value: "past" },
	{ label: translationKeys.Custom, value: "custom" },
];

export const providerAppointmentPatientFilters: {
	label: TranslationKey;
	value: ProviderAppointmentPatientFilter;
}[] = [
	{ label: translationKeys["All patients"], value: "all" },
	{ label: translationKeys["Account holders"], value: "account" },
	{ label: translationKeys["Third-party"], value: "third-party" },
	{ label: translationKeys["No account"], value: "unregistered" },
];

export const providerAppointmentSortOptions: {
	label: TranslationKey;
	value: ProviderAppointmentSortOrder;
}[] = [
	{ label: translationKeys.Soonest, value: "soonest" },
	{ label: translationKeys.Latest, value: "latest" },
];

export const getProviderAppointmentStatusConfig = (status: string) => {
	switch (status) {
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

export const getProviderAppointmentStatusActions = (
	appointment: Appointment,
) => {
	switch (appointment.status) {
		case "SCHEDULED":
			return [
				{ text: translationKeys.Confirm, status: "CONFIRMED" as const },
				{ text: translationKeys["Start Visit"], status: "IN_PROGRESS" as const },
				{ text: translationKeys["Mark No Show"], status: "NO_SHOW" as const },
				{
					text: translationKeys.Cancel,
					status: "CANCELLED" as const,
					style: "destructive" as const,
				},
			];
		case "CONFIRMED":
			return [
				{ text: translationKeys["Start Visit"], status: "IN_PROGRESS" as const },
				{ text: translationKeys["Mark No Show"], status: "NO_SHOW" as const },
				{
					text: translationKeys.Cancel,
					status: "CANCELLED" as const,
					style: "destructive" as const,
				},
			];
		case "IN_PROGRESS":
			return [
				{ text: translationKeys["Complete Visit"], status: "COMPLETED" as const },
				{
					text: translationKeys.Cancel,
					status: "CANCELLED" as const,
					style: "destructive" as const,
				},
			];
		default:
			return [];
	}
};

export const formatProviderAppointmentTime = (isoString: string) => {
	const date = new Date(isoString);
	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

export const formatProviderAppointmentDate = (isoString: string) => {
	const date = new Date(isoString);
	return date.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

export const getProviderAppointmentProcedureOptions = (
	appointments: Appointment[],
): ProcedureFilterOption[] => {
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
};

export const filterAppointmentsByTab = (
	appointments: Appointment[],
	tab: ProviderAppointmentTab,
) =>
	appointments.filter((appointment) =>
		providerAppointmentTabStatuses[tab].includes(appointment.status),
	);

export const getActiveProviderAppointmentFilterCount = (
	filters: ProviderAppointmentFiltersForm,
) =>
	[
		filters.searchQuery.trim(),
		filters.dateFilter !== "all",
		filters.statusFilter !== "ALL",
		filters.patientFilter !== "all",
		filters.procedureFilter !== "all",
		filters.sortOrder !== "soonest",
	].filter(Boolean).length;

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

const getDateRangeForFilter = (filters: ProviderAppointmentFiltersForm) => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const sevenDaysFromNow = new Date(today);
	sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
	sevenDaysFromNow.setHours(23, 59, 59, 999);

	switch (filters.dateFilter) {
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
				start: filters.customStartDate
					? parseDateInput(filters.customStartDate)
					: null,
				end: filters.customEndDate
					? parseDateInput(filters.customEndDate, true)
					: null,
			};
		default:
			return { start: null, end: null };
	}
};

const getPatientFilterMatch = (
	appointment: Appointment,
	filter: ProviderAppointmentPatientFilter,
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

export const getFilteredProviderAppointments = ({
	appointments,
	activeTab,
	filters,
}: {
	appointments: Appointment[];
	activeTab: ProviderAppointmentTab;
	filters: ProviderAppointmentFiltersForm;
}) => {
	const query = filters.searchQuery.toLowerCase().trim();
	const { start, end } = getDateRangeForFilter(filters);

	return filterAppointmentsByTab(appointments, activeTab)
		.filter((appointment) => {
			if (!query) {
				return true;
			}

			const patientName = getAppointmentPatientName(appointment).toLowerCase();
			const patientPhone =
				appointment.patientProfile?.phone || appointment.customer?.user.phone || "";
			const patientEmail =
				appointment.patientProfile?.email || appointment.customer?.user.email || "";
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
			filters.statusFilter === "ALL"
				? true
				: appointment.status === filters.statusFilter,
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
			getPatientFilterMatch(appointment, filters.patientFilter),
		)
		.filter((appointment) =>
			filters.procedureFilter === "all"
				? true
				: appointment.appointmentProcedures.some(
						(ap) => ap.procedure.id === filters.procedureFilter,
					),
		)
		.sort((a, b) => {
			const dateA = new Date(a.scheduledAt).getTime();
			const dateB = new Date(b.scheduledAt).getTime();
			return filters.sortOrder === "soonest" ? dateA - dateB : dateB - dateA;
		});
};
