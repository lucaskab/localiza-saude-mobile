import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	CustomerHomeSummary,
	CustomerHomeSummaryResponse,
} from "@/types/customer-home-summary";

export const useCustomerHomeSummary = (enabled = true) => {
	return useQuery({
		queryKey: ["customer-home-summary"],
		enabled,
		queryFn: async (): Promise<CustomerHomeSummary> => {
			const { data } = await api.get<CustomerHomeSummaryResponse>(
				"/customers/me/home-summary",
			);
			return data.summary;
		},
	});
};
