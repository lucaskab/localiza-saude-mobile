import type { GetDashboardResponse } from "@/types/dashboard";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

export const getDashboardData = async (
	healthcareProviderId: string,
): Promise<GetDashboardResponse> => {
	const { data } = await api.get<GetDashboardResponse>(
		`/healthcare-providers/${healthcareProviderId}/dashboard`,
	);
	return data;
};

export const useDashboard = (
	healthcareProviderId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["dashboard", healthcareProviderId],
		queryFn: () => getDashboardData(healthcareProviderId),
		enabled: enabled && !!healthcareProviderId,
		staleTime: 1000 * 60 * 5, // 5 minutes - dashboard data doesn't need to be super fresh
	});
};
