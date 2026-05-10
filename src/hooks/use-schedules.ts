import type {
	GetSchedulesResponse,
	GetScheduleExceptionsResponse,
	CreateScheduleData,
	CreateScheduleResponse,
	UpdateScheduleData,
	UpdateScheduleResponse,
	CreateScheduleExceptionData,
	CreateScheduleExceptionResponse,
	UpdateScheduleExceptionData,
	UpdateScheduleExceptionResponse,
} from "@/types/schedule";
import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Get schedules by healthcare provider ID
export const getSchedulesByProvider = async (
	healthcareProviderId: string,
): Promise<GetSchedulesResponse> => {
	const { data } = await api.get<GetSchedulesResponse>(
		`/healthcare-providers/${healthcareProviderId}/schedules`,
	);
	return data;
};

export const useSchedulesByProvider = (
	healthcareProviderId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["schedules", "provider", healthcareProviderId],
		queryFn: () => getSchedulesByProvider(healthcareProviderId),
		enabled: enabled && !!healthcareProviderId,
	});
};

// Create schedule mutation
export const createSchedule = async (
	data: CreateScheduleData,
): Promise<CreateScheduleResponse> => {
	const { data: response } = await api.post<CreateScheduleResponse>(
		"/healthcare-provider-schedules",
		data,
	);
	return response;
};

export const useCreateSchedule = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createSchedule,
		onSuccess: (_, variables) => {
			// Invalidate schedules for the provider
			queryClient.invalidateQueries({
				queryKey: ["schedules", "provider", variables.healthcareProviderId],
			});
		},
	});
};

// Update schedule mutation
export const updateSchedule = async (
	scheduleId: string,
	data: UpdateScheduleData,
): Promise<UpdateScheduleResponse> => {
	const { data: response } = await api.patch<UpdateScheduleResponse>(
		`/healthcare-provider-schedules/${scheduleId}`,
		data,
	);
	return response;
};

export const useUpdateSchedule = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			scheduleId,
			data,
		}: {
			scheduleId: string;
			data: UpdateScheduleData;
		}) => updateSchedule(scheduleId, data),
		onSuccess: (response) => {
			// Invalidate schedules for the provider
			queryClient.invalidateQueries({
				queryKey: [
					"schedules",
					"provider",
					response.schedule.healthcareProviderId,
				],
			});
		},
	});
};

// Delete schedule mutation
export const deleteSchedule = async (
	scheduleId: string,
): Promise<{ message: string }> => {
	const { data } = await api.delete<{ message: string }>(
		`/healthcare-provider-schedules/${scheduleId}`,
	);
	return data;
};

export const useDeleteSchedule = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteSchedule,
		onSuccess: () => {
			// Invalidate all schedules queries
			queryClient.invalidateQueries({
				queryKey: ["schedules"],
			});
		},
	});
};

export const getScheduleExceptionsByProvider = async (
	healthcareProviderId: string,
): Promise<GetScheduleExceptionsResponse> => {
	const { data } = await api.get<GetScheduleExceptionsResponse>(
		`/healthcare-providers/${healthcareProviderId}/schedule-exceptions`,
	);
	return data;
};

export const useScheduleExceptionsByProvider = (
	healthcareProviderId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["schedule-exceptions", "provider", healthcareProviderId],
		queryFn: () => getScheduleExceptionsByProvider(healthcareProviderId),
		enabled: enabled && !!healthcareProviderId,
	});
};

export const createScheduleException = async (
	data: CreateScheduleExceptionData,
): Promise<CreateScheduleExceptionResponse> => {
	const { data: response } = await api.post<CreateScheduleExceptionResponse>(
		"/healthcare-provider-schedule-exceptions",
		data,
	);
	return response;
};

export const useCreateScheduleException = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createScheduleException,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: [
					"schedule-exceptions",
					"provider",
					variables.healthcareProviderId,
				],
			});
			queryClient.invalidateQueries({
				queryKey: ["time-slots", variables.healthcareProviderId],
			});
		},
	});
};

export const updateScheduleException = async (
	exceptionId: string,
	data: UpdateScheduleExceptionData,
): Promise<UpdateScheduleExceptionResponse> => {
	const { data: response } = await api.patch<UpdateScheduleExceptionResponse>(
		`/healthcare-provider-schedule-exceptions/${exceptionId}`,
		data,
	);
	return response;
};

export const useUpdateScheduleException = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			exceptionId,
			data,
		}: {
			exceptionId: string;
			data: UpdateScheduleExceptionData;
		}) => updateScheduleException(exceptionId, data),
		onSuccess: (response) => {
			queryClient.invalidateQueries({
				queryKey: [
					"schedule-exceptions",
					"provider",
					response.exception.healthcareProviderId,
				],
			});
			queryClient.invalidateQueries({
				queryKey: ["time-slots", response.exception.healthcareProviderId],
			});
		},
	});
};

export const deleteScheduleException = async (
	exceptionId: string,
): Promise<void> => {
	await api.delete(`/healthcare-provider-schedule-exceptions/${exceptionId}`);
};

export const useDeleteScheduleException = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteScheduleException,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["schedule-exceptions"],
			});
			queryClient.invalidateQueries({
				queryKey: ["time-slots"],
			});
		},
	});
};
