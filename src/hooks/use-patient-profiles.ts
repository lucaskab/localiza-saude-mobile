import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	CreatePatientProfileResponse,
	GetPatientProfilesResponse,
	PatientProfileData,
} from "@/types/patient-profile";

export const getPatientProfiles =
	async (): Promise<GetPatientProfilesResponse> => {
		const { data } =
			await api.get<GetPatientProfilesResponse>("/patient-profiles");
		return data;
	};

export const createPatientProfile = async (
	profile: PatientProfileData,
): Promise<CreatePatientProfileResponse> => {
	const { data } = await api.post<CreatePatientProfileResponse>(
		"/patient-profiles",
		profile,
	);
	return data;
};

export const usePatientProfiles = (enabled = true) => {
	return useQuery({
		queryKey: ["patient-profiles"],
		queryFn: getPatientProfiles,
		enabled,
	});
};

export const useCreatePatientProfile = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createPatientProfile,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["patient-profiles"] });
		},
	});
};
