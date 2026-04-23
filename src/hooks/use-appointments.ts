import type {
	CreateAppointmentData,
	CreateAppointmentResponse,
	GetAppointmentByIdResponse,
	GetAppointmentsResponse,
	GetAvailabilityResponse,
	GetTimeSlotsResponse,
	UpdateAppointmentData,
	UpdateAppointmentResponse,
	DeleteAppointmentResponse,
} from "@/types/appointment";
import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Get all appointments with optional filters
interface GetAppointmentsParams {
	healthcareProviderId?: string;
	startDate?: string; // YYYY-MM-DD format
	endDate?: string; // YYYY-MM-DD format
}

export const getAppointments = async (
	params?: GetAppointmentsParams,
): Promise<GetAppointmentsResponse> => {
	const queryParams = new URLSearchParams();

	if (params?.healthcareProviderId) {
		queryParams.append("healthcareProviderId", params.healthcareProviderId);
	}
	if (params?.startDate) {
		queryParams.append("startDate", params.startDate);
	}
	if (params?.endDate) {
		queryParams.append("endDate", params.endDate);
	}

	const queryString = queryParams.toString();
	const url = queryString ? `/appointments?${queryString}` : "/appointments";

	const { data } = await api.get<GetAppointmentsResponse>(url);
	return data;
};

export const useAppointments = (
	params?: GetAppointmentsParams,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: [
			"appointments",
			params?.healthcareProviderId,
			params?.startDate,
			params?.endDate,
		],
		queryFn: () => getAppointments(params),
		enabled,
	});
};

// Get provider's appointments for today
export const useProviderTodayAppointments = (
	healthcareProviderId: string,
	enabled: boolean = true,
) => {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

	return useQuery({
		queryKey: [
			"appointments",
			"provider",
			healthcareProviderId,
			"today",
			today,
		],
		queryFn: () =>
			getAppointments({
				healthcareProviderId,
				startDate: today,
				endDate: today,
			}),
		enabled: enabled && !!healthcareProviderId,
	});
};

// Get appointments by customer ID
export const getAppointmentsByCustomer = async (
	customerId: string,
): Promise<GetAppointmentsResponse> => {
	const { data } = await api.get<GetAppointmentsResponse>(
		`/customers/${customerId}/appointments`,
	);
	return data;
};

export const useAppointmentsByCustomer = (
	customerId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["appointments", "customer", customerId],
		queryFn: () => getAppointmentsByCustomer(customerId),
		enabled: enabled && !!customerId,
	});
};

// Get single appointment by ID
export const getAppointmentById = async (
	appointmentId: string,
): Promise<GetAppointmentByIdResponse> => {
	const { data } = await api.get<GetAppointmentByIdResponse>(
		`/appointments/${appointmentId}`,
	);
	return data;
};

export const useAppointment = (
	appointmentId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["appointment", appointmentId],
		queryFn: () => getAppointmentById(appointmentId),
		enabled: enabled && !!appointmentId,
	});
};

// Get healthcare provider availability
interface GetAvailabilityParams {
	healthcareProviderId: string;
	date: string; // YYYY-MM-DD format
	procedureIds?: string[];
}

export const getAvailability = async ({
	healthcareProviderId,
	date,
	procedureIds,
}: GetAvailabilityParams): Promise<GetAvailabilityResponse> => {
	const params = new URLSearchParams({ date });

	if (procedureIds && procedureIds.length > 0) {
		params.append("procedureIds", procedureIds.join(","));
	}

	const { data } = await api.get<GetAvailabilityResponse>(
		`/healthcare-providers/${healthcareProviderId}/availability?${params.toString()}`,
	);
	return data;
};

export const useAvailability = ({
	healthcareProviderId,
	date,
	procedureIds,
	enabled = true,
}: GetAvailabilityParams & { enabled?: boolean }) => {
	return useQuery({
		queryKey: [
			"availability",
			healthcareProviderId,
			date,
			procedureIds?.join(","),
		],
		queryFn: () =>
			getAvailability({
				healthcareProviderId,
				date,
				procedureIds,
			}),
		enabled: enabled && !!healthcareProviderId && !!date,
	});
};

// Get healthcare provider time slots
interface GetTimeSlotsParams {
	healthcareProviderId: string;
	date: string; // YYYY-MM-DD format
	procedureIds: string[];
}

export const getTimeSlots = async ({
	healthcareProviderId,
	date,
	procedureIds,
}: GetTimeSlotsParams): Promise<GetTimeSlotsResponse> => {
	const params = new URLSearchParams({ date });

	if (procedureIds && procedureIds.length > 0) {
		params.append("procedureIds", procedureIds.join(","));
	}

	const { data } = await api.get<GetTimeSlotsResponse>(
		`/healthcare-providers/${healthcareProviderId}/slots?${params.toString()}`,
	);
	return data;
};

export const useTimeSlots = ({
	healthcareProviderId,
	date,
	procedureIds,
	enabled = true,
}: GetTimeSlotsParams & { enabled?: boolean }) => {
	return useQuery({
		queryKey: [
			"timeSlots",
			healthcareProviderId,
			date,
			procedureIds?.join(","),
		],
		queryFn: () =>
			getTimeSlots({
				healthcareProviderId,
				date,
				procedureIds,
			}),
		enabled:
			enabled && !!healthcareProviderId && !!date && procedureIds.length > 0,
	});
};

// Create appointment mutation</text>
export const createAppointment = async (
	data: CreateAppointmentData,
): Promise<CreateAppointmentResponse> => {
	const { data: response } = await api.post<CreateAppointmentResponse>(
		"/appointments",
		data,
	);
	return response;
};

export const useCreateAppointment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createAppointment,
		onSuccess: () => {
			// Invalidate and refetch appointments
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
		},
	});
};

// Update appointment mutation
export const updateAppointment = async (
	appointmentId: string,
	data: UpdateAppointmentData,
): Promise<UpdateAppointmentResponse> => {
	const { data: response } = await api.patch<UpdateAppointmentResponse>(
		`/appointments/${appointmentId}`,
		data,
	);
	return response;
};

export const useUpdateAppointment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			appointmentId,
			data,
		}: {
			appointmentId: string;
			data: UpdateAppointmentData;
		}) => updateAppointment(appointmentId, data),
		onSuccess: (_, variables) => {
			// Invalidate specific appointment and appointments list
			queryClient.invalidateQueries({
				queryKey: ["appointment", variables.appointmentId],
			});
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
		},
	});
};

// Delete appointment mutation
export const deleteAppointment = async (
	appointmentId: string,
): Promise<DeleteAppointmentResponse> => {
	const { data } = await api.delete<DeleteAppointmentResponse>(
		`/appointments/${appointmentId}`,
	);
	return data;
};

export const useDeleteAppointment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteAppointment,
		onSuccess: () => {
			// Invalidate appointments list
			queryClient.invalidateQueries({ queryKey: ["appointments"] });
		},
	});
};
