import { api } from "@/services/api";
import type { ProfessionalCouncil } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

export const getProfessionalCouncils = async (): Promise<{
	professionalCouncils: ProfessionalCouncil[];
}> => {
	const { data } = await api.get<{ professionalCouncils: ProfessionalCouncil[] }>(
		"/professional-councils",
	);

	return data;
};

export const useProfessionalCouncils = () => {
	return useQuery({
		queryKey: ["professional-councils"],
		queryFn: getProfessionalCouncils,
	});
};
