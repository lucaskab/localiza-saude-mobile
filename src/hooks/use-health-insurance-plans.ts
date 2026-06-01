import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	HealthInsurancePlan,
	HealthInsurancePlansResponse,
} from "@/types/health-insurance-plan";

export const useHealthInsurancePlans = () => {
	return useQuery({
		queryKey: ["health-insurance-plans"],
		queryFn: async (): Promise<HealthInsurancePlan[]> => {
			const { data } = await api.get<HealthInsurancePlansResponse>(
				"/health-insurance-plans",
			);
			return data.healthInsurancePlans;
		},
		staleTime: 1000 * 60 * 30,
	});
};
