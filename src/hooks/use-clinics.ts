import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Clinic, ClinicEmployee, ClinicEmployeeRole } from "@/types/user";

export type ClinicPayload = {
	name: string;
	phone: string;
	email: string;
	type: Clinic["type"];
	description?: string | null;
	address?: string | null;
	latitude?: number | null;
	longitude?: number | null;
};

export const useMyClinics = () => {
	return useQuery({
		queryKey: ["clinics", "my"],
		queryFn: async () => {
			const { data } = await api.get<{ clinics: Clinic[] }>("/clinics/my");
			return data.clinics;
		},
	});
};

export const useClinicEmployees = (clinicId?: string) => {
	return useQuery({
		queryKey: ["clinics", clinicId, "employees"],
		enabled: Boolean(clinicId),
		queryFn: async () => {
			const { data } = await api.get<{ employees: ClinicEmployee[] }>(
				`/clinics/${clinicId}/employees`,
			);
			return data.employees;
		},
	});
};

export const useCreateClinic = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (payload: ClinicPayload) => {
			const { data } = await api.post<{ clinic: Clinic }>("/clinics", payload);
			return data.clinic;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clinics", "my"] });
		},
	});
};

export const useUpdateClinic = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			clinicId,
			payload,
		}: {
			clinicId: string;
			payload: Partial<ClinicPayload>;
		}) => {
			const { data } = await api.put<{ clinic: Clinic }>(
				`/clinics/${clinicId}`,
				payload,
			);
			return data.clinic;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["clinics", "my"] });
		},
	});
};

export const useUpsertClinicEmployee = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			clinicId,
			role,
			userEmail,
		}: {
			clinicId: string;
			role: Exclude<ClinicEmployeeRole, "OWNER">;
			userEmail: string;
		}) => {
			const { data } = await api.post<{ employee: ClinicEmployee }>(
				`/clinics/${clinicId}/employees`,
				{ role, userEmail },
			);
			return data.employee;
		},
		onSuccess: (employee) => {
			queryClient.invalidateQueries({ queryKey: ["clinics", "my"] });
			queryClient.invalidateQueries({
				queryKey: ["clinics", employee.clinicId, "employees"],
			});
		},
	});
};

export const useRemoveClinicEmployee = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			clinicId,
			userId,
		}: {
			clinicId: string;
			userId: string;
		}) => {
			await api.delete(`/clinics/${clinicId}/employees/${userId}`);
			return { clinicId };
		},
		onSuccess: ({ clinicId }) => {
			queryClient.invalidateQueries({ queryKey: ["clinics", "my"] });
			queryClient.invalidateQueries({ queryKey: ["clinics", clinicId, "employees"] });
		},
	});
};
