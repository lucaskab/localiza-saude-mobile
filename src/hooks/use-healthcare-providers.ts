import type {
	GetHealthcareProvidersResponse,
	HealthcareProvider,
} from "@/types/healthcare-provider";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface UseHealthcareProvidersParams {
	specialty?: string;
	enabled?: boolean;
}

export const getHealthcareProviders = async ({
	specialty,
}: UseHealthcareProvidersParams = {}): Promise<GetHealthcareProvidersResponse> => {
	const params = new URLSearchParams();

	if (specialty) {
		params.append("specialty", specialty);
	}

	const queryString = params.toString();
	const url = queryString
		? `/healthcare-providers?${queryString}`
		: "/healthcare-providers";

	const { data } = await api.get<GetHealthcareProvidersResponse>(url);
	return data;
};

export const useHealthcareProviders = ({
	specialty,
	enabled = true,
}: UseHealthcareProvidersParams = {}) => {
	return useQuery({
		queryKey: ["healthcare-providers", specialty],
		queryFn: () =>
			getHealthcareProviders({
				specialty,
			}),
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
