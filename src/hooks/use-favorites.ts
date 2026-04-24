import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	AddFavoriteData,
	AddFavoriteResponse,
	GetFavoritesResponse,
	RemoveFavoriteResponse,
} from "@/types/favorite";

export const getFavorites = async (): Promise<GetFavoritesResponse> => {
	const { data } = await api.get<GetFavoritesResponse>("/favorites");
	return data;
};

export const useFavorites = (enabled = true) => {
	return useQuery({
		queryKey: ["favorites"],
		queryFn: getFavorites,
		enabled,
		staleTime: 0,
		refetchOnMount: "always",
	});
};

export const addFavorite = async (
	data: AddFavoriteData,
): Promise<AddFavoriteResponse> => {
	const { data: response } = await api.post<AddFavoriteResponse>(
		"/favorites",
		data,
	);
	return response;
};

export const useAddFavorite = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: addFavorite,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["favorites"] });
		},
	});
};

export const removeFavorite = async (
	healthcareProviderId: string,
): Promise<RemoveFavoriteResponse> => {
	const { data } = await api.delete<RemoveFavoriteResponse>(
		`/favorites/${healthcareProviderId}`,
	);
	return data;
};

export const useRemoveFavorite = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: removeFavorite,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["favorites"] });
		},
	});
};
