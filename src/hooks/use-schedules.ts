import type {
	GetSchedulesResponse,
	CreateScheduleData,
	CreateScheduleResponse,
	UpdateScheduleData,
	UpdateScheduleResponse,
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
