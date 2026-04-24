import { api } from "@/services/api";
import type {
	CreateRatingData,
	CreateRatingResponse,
	DeleteRatingResponse,
	GetRatingsByProviderResponse,
	UpdateRatingData,
	UpdateRatingResponse,
} from "@/types/rating";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const getRatingsByProvider = async (
	healthcareProviderId: string,
): Promise<GetRatingsByProviderResponse> => {
	const { data } = await api.get<GetRatingsByProviderResponse>(
		`/healthcare-providers/${healthcareProviderId}/ratings`,
	);
	return data;
};

export const useRatingsByProvider = (
	healthcareProviderId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["ratings", "provider", healthcareProviderId],
		queryFn: () => getRatingsByProvider(healthcareProviderId),
		enabled: enabled && !!healthcareProviderId,
		staleTime: 0,
		refetchOnMount: "always",
	});
};

export const createRating = async (
	data: CreateRatingData,
): Promise<CreateRatingResponse> => {
	const { data: response } = await api.post<CreateRatingResponse>(
		"/ratings",
		data,
	);
	return response;
};

export const useCreateRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createRating,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["ratings", "provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({ queryKey: ["healthcare-providers"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
};

export const updateRating = async (
	ratingId: string,
	data: UpdateRatingData,
): Promise<UpdateRatingResponse> => {
	const { data: response } = await api.put<UpdateRatingResponse>(
		`/ratings/${ratingId}`,
		data,
	);
	return response;
};

export const useUpdateRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			ratingId,
			healthcareProviderId,
			data,
		}: {
			ratingId: string;
			healthcareProviderId: string;
			data: UpdateRatingData;
		}) => updateRating(ratingId, data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["ratings", "provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({ queryKey: ["healthcare-providers"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
};

export const deleteRating = async (
	ratingId: string,
): Promise<DeleteRatingResponse> => {
	const { data } = await api.delete<DeleteRatingResponse>(
		`/ratings/${ratingId}`,
	);
	return data;
};

export const useDeleteRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			ratingId,
		}: {
			ratingId: string;
			healthcareProviderId: string;
		}) => deleteRating(ratingId),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["ratings", "provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", variables.healthcareProviderId],
			});
			queryClient.invalidateQueries({ queryKey: ["healthcare-providers"] });
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
};
