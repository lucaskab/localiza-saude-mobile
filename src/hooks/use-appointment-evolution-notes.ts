import { api } from "@/services/api";
import type {
	AppointmentEvolutionNotePayload,
	AppointmentEvolutionNoteResponse,
} from "@/types/appointment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAppointmentEvolutionNote = (
	appointmentId: string,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["appointment-evolution-note", appointmentId],
		queryFn: async () => {
			const { data } = await api.get<AppointmentEvolutionNoteResponse>(
				`/appointments/${appointmentId}/evolution-note`,
			);
			return data;
		},
		enabled: enabled && !!appointmentId,
	});
};

export const useUpsertAppointmentEvolutionNote = (appointmentId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: AppointmentEvolutionNotePayload) => {
			const { data } = await api.put<AppointmentEvolutionNoteResponse>(
				`/appointments/${appointmentId}/evolution-note`,
				payload,
			);
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(
				["appointment-evolution-note", appointmentId],
				data,
			);
		},
	});
};
