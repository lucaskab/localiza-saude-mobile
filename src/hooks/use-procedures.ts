import type {
	Procedure,
	HealthcareProvider,
} from "@/types/healthcare-provider";
import { api } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface GetProceduresResponse {
	procedures: Procedure[];
}

// Get all procedures
export const getProcedures = async (): Promise<GetProceduresResponse> => {
	const { data } = await api.get<GetProceduresResponse>("/procedures");
	return data;
};

export const useProcedures = (enabled: boolean = true) => {
	return useQuery({
		queryKey: ["procedures"],
		queryFn: () => getProcedures(),
		enabled,
	});
};

// Get procedures by healthcare provider ID
interface UseProceduresByProviderParams {
	healthcareProviderId: string;
	enabled?: boolean;
}

export const getProceduresByProvider = async (
	healthcareProviderId: string,
): Promise<GetProceduresResponse> => {
	const { data } = await api.get<GetProceduresResponse>(
		`/healthcare-providers/${healthcareProviderId}/procedures`,
	);
	return data;
};

export const useProceduresByProvider = ({
	healthcareProviderId,
	enabled = true,
}: UseProceduresByProviderParams) => {
	return useQuery({
		queryKey: ["procedures", "provider", healthcareProviderId],
		queryFn: () => getProceduresByProvider(healthcareProviderId),
		enabled: enabled && !!healthcareProviderId,
	});
};

// Get a single procedure by ID
export const getProcedureById = async (
	procedureId: string,
): Promise<{ procedure: Procedure }> => {
	const { data } = await api.get<{ procedure: Procedure }>(
		`/procedures/${procedureId}`,
	);
	return data;
};

export const useProcedure = (procedureId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: ["procedure", procedureId],
		queryFn: () => getProcedureById(procedureId),
		enabled: enabled && !!procedureId,
	});
};

// Create procedure mutation
interface CreateProcedureData {
	name: string;
	description?: string | null;
	priceInCents: number;
	durationInMinutes: number;
	healthcareProviderId: string;
}

export const createProcedure = async (
	data: CreateProcedureData,
): Promise<{ procedure: Procedure }> => {
	const { data: response } = await api.post<{ procedure: Procedure }>(
		"/procedures",
		data,
	);
	return response;
};

export const useCreateProcedure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createProcedure,
		onSuccess: (_, variables) => {
			// Invalidate procedures for the provider
			queryClient.invalidateQueries({
				queryKey: ["procedures", "provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({ queryKey: ["procedures"] });
		},
	});
};

// Update procedure mutation
interface UpdateProcedureData {
	name?: string;
	description?: string | null;
	priceInCents?: number;
	durationInMinutes?: number;
}

export const updateProcedure = async (
	procedureId: string,
	data: UpdateProcedureData,
): Promise<{ procedure: Procedure }> => {
	const { data: response } = await api.patch<{ procedure: Procedure }>(
		`/procedures/${procedureId}`,
		data,
	);
	return response;
};

export const useUpdateProcedure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			procedureId,
			data,
		}: {
			procedureId: string;
			data: UpdateProcedureData;
		}) => updateProcedure(procedureId, data),
		onSuccess: (response) => {
			// Invalidate procedure and procedures list
			queryClient.invalidateQueries({
				queryKey: ["procedure", response.procedure.id],
			});
			queryClient.invalidateQueries({
				queryKey: [
					"procedures",
					"provider",
					response.procedure.healthcareProviderId,
				],
			});
			queryClient.invalidateQueries({ queryKey: ["procedures"] });
		},
	});
};

// Delete procedure mutation
export const deleteProcedure = async (
	procedureId: string,
): Promise<{ message: string }> => {
	const { data } = await api.delete<{ message: string }>(
		`/procedures/${procedureId}`,
	);
	return data;
};

export const useDeleteProcedure = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteProcedure,
		onSuccess: () => {
			// Invalidate all procedures queries
			queryClient.invalidateQueries({ queryKey: ["procedures"] });
		},
	});
};

// Update healthcare provider mutation
interface UpdateHealthcareProviderData {
	specialty?: string | null;
	professionalId?: string | null;
	bio?: string | null;
}

export const updateHealthcareProvider = async (
	providerId: string,
	data: UpdateHealthcareProviderData,
): Promise<{ healthcareProvider: HealthcareProvider }> => {
	const { data: response } = await api.patch<{
		healthcareProvider: HealthcareProvider;
	}>(`/healthcare-providers/${providerId}`, data);
	return response;
};

export const useUpdateHealthcareProvider = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			providerId,
			data,
		}: {
			providerId: string;
			data: UpdateHealthcareProviderData;
		}) => updateHealthcareProvider(providerId, data),
		onSuccess: (response) => {
			// Invalidate healthcare provider queries
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", response.healthcareProvider.id],
			});
			queryClient.invalidateQueries({
				queryKey: [
					"healthcare-provider",
					"by-user",
					response.healthcareProvider.userId,
				],
			});
		},
	});
};
