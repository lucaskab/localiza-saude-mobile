import { api } from "@/services/api";
import type { ProfessionalCouncil } from "@/types/user";
import { useQuery } from "@tanstack/react-query";

interface GetProfessionalCouncilsResponse {
  professionalCouncils: ProfessionalCouncil[];
}

export const getProfessionalCouncils =
  async (): Promise<GetProfessionalCouncilsResponse> => {
    const { data } = await api.get<GetProfessionalCouncilsResponse>(
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
