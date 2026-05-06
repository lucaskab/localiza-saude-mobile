import type {
	GetHealthcareProvidersResponse,
	HealthcareProvider,
} from "@/types/healthcare-provider";
import { api } from "@/services/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

interface UseHealthcareProvidersParams {
	search?: string;
	specialty?: string;
	serviceModality?: string;
	language?: string;
	insurance?: string;
	verified?: boolean;
	superProfessional?: boolean;
	available?: boolean;
	minRating?: number;
	maxPriceCents?: number;
	limit?: number;
	offset?: number;
	enabled?: boolean;
}

export const getHealthcareProviders = async ({
	search,
	specialty,
	serviceModality,
	language,
	insurance,
	verified,
	superProfessional,
	available,
	minRating,
	maxPriceCents,
	limit,
	offset,
}: UseHealthcareProvidersParams = {}): Promise<GetHealthcareProvidersResponse> => {
	const params = new URLSearchParams();

	if (search) {
		params.append("search", search);
	}

	if (specialty) {
		params.append("specialty", specialty);
	}

	if (serviceModality) {
		params.append("serviceModality", serviceModality);
	}

	if (language) {
		params.append("language", language);
	}

	if (insurance) {
		params.append("insurance", insurance);
	}

	if (verified) {
		params.append("verified", "true");
	}

	if (superProfessional) {
		params.append("superProfessional", "true");
	}

	if (available) {
		params.append("available", "true");
	}

	if (typeof minRating === "number") {
		params.append("minRating", minRating.toString());
	}

	if (typeof maxPriceCents === "number") {
		params.append("maxPriceCents", maxPriceCents.toString());
	}

	if (typeof limit === "number") {
		params.append("limit", limit.toString());
	}

	if (typeof offset === "number") {
		params.append("offset", offset.toString());
	}

	const queryString = params.toString();
	const url = queryString
		? `/healthcare-providers?${queryString}`
		: "/healthcare-providers";

	const { data } = await api.get<GetHealthcareProvidersResponse>(url);
	return data;
};

export const useHealthcareProviders = ({
	search,
	specialty,
	serviceModality,
	language,
	insurance,
	verified,
	superProfessional,
	available,
	minRating,
	maxPriceCents,
	limit,
	enabled = true,
}: UseHealthcareProvidersParams = {}) => {
	return useQuery({
		queryKey: [
			"healthcare-providers",
			search,
			specialty,
			serviceModality,
			language,
			insurance,
			verified,
			superProfessional,
			available,
			minRating,
			maxPriceCents,
			limit,
		],
		queryFn: () =>
			getHealthcareProviders({
				search,
				specialty,
				serviceModality,
				language,
				insurance,
				verified,
				superProfessional,
				available,
				minRating,
				maxPriceCents,
				limit,
			}),
		enabled,
		staleTime: 0,
		refetchOnMount: "always",
	});
};

export const useInfiniteHealthcareProviders = ({
	search,
	specialty,
	serviceModality,
	language,
	insurance,
	verified,
	superProfessional,
	available,
	minRating,
	maxPriceCents,
	limit = 20,
	enabled = true,
}: UseHealthcareProvidersParams = {}) => {
	return useInfiniteQuery({
		queryKey: [
			"healthcare-providers",
			"infinite",
			search,
			specialty,
			serviceModality,
			language,
			insurance,
			verified,
			superProfessional,
			available,
			minRating,
			maxPriceCents,
			limit,
		],
		queryFn: ({ pageParam }) =>
			getHealthcareProviders({
				search,
				specialty,
				serviceModality,
				language,
				insurance,
				verified,
				superProfessional,
				available,
				minRating,
				maxPriceCents,
				limit,
				offset: pageParam,
			}),
		getNextPageParam: (lastPage, allPages) => {
			const totalLoaded = allPages.reduce(
				(total, page) => total + page.healthcareProviders.length,
				0,
			);

			return totalLoaded < lastPage.total ? totalLoaded : undefined;
		},
		initialPageParam: 0,
		enabled,
		staleTime: 0,
		refetchOnMount: "always",
	});
};

// Helper hook to get a single provider by ID
export const getHealthcareProviderById = async (
	providerId: string,
): Promise<{ healthcareProvider: HealthcareProvider }> => {
	const { data } = await api.get<{ healthcareProvider: HealthcareProvider }>(
		`/healthcare-providers/${providerId}`,
	);
	return data;
};

export const useHealthcareProvider = (
	providerId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["healthcare-provider", providerId],
		queryFn: () => getHealthcareProviderById(providerId),
		enabled: enabled && !!providerId,
	});
};

// Helper hook to get a provider by user ID
export const getHealthcareProviderByUserId = async (
	userId: string,
): Promise<{ healthcareProvider: HealthcareProvider }> => {
	const { data } = await api.get<{ healthcareProvider: HealthcareProvider }>(
		`/healthcare-providers/user/${userId}`,
	);

	return data;
};

export const useHealthcareProviderByUserId = (
	userId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["healthcare-provider", "by-user", userId],
		queryFn: () => getHealthcareProviderByUserId(userId),
		enabled: enabled && !!userId,
	});
};

// Helper hook to get nearby providers based on location
interface UseNearbyHealthcareProvidersParams {
	latitude: number;
	longitude: number;
	radiusInKm?: number;
	enabled?: boolean;
}

export const getNearbyHealthcareProviders = async ({
	latitude,
	longitude,
	radiusInKm = 10,
}: Omit<
	UseNearbyHealthcareProvidersParams,
	"enabled"
>): Promise<GetHealthcareProvidersResponse> => {
	const params = new URLSearchParams({
		latitude: latitude.toString(),
		longitude: longitude.toString(),
		radiusInKm: radiusInKm.toString(),
	});

	const { data } = await api.get<GetHealthcareProvidersResponse>(
		`/healthcare-providers/nearby?${params.toString()}`,
	);
	return data;
};

export const useNearbyHealthcareProviders = ({
	latitude,
	longitude,
	radiusInKm = 10,
	enabled = true,
}: UseNearbyHealthcareProvidersParams) => {
	return useQuery({
		queryKey: [
			"healthcare-providers",
			"nearby",
			latitude,
			longitude,
			radiusInKm,
		],
		queryFn: () =>
			getNearbyHealthcareProviders({
				latitude,
				longitude,
				radiusInKm,
			}),
		enabled: enabled && !!latitude && !!longitude,
	});
};
