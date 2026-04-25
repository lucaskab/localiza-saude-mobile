import { api } from "@/services/api";
import type {
	GetMedicalRecordResponse,
	MedicalRecordData,
	UpsertMedicalRecordResponse,
} from "@/types/medical-record";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const getMyMedicalRecord =
	async (): Promise<GetMedicalRecordResponse> => {
		const { data } = await api.get<GetMedicalRecordResponse>("/medical-record");
		return data;
	};

export const getCustomerMedicalRecord = async (
	customerId: string,
): Promise<GetMedicalRecordResponse> => {
	const { data } = await api.get<GetMedicalRecordResponse>(
		`/customers/${customerId}/medical-record`,
	);
	return data;
};

export const getAppointmentMedicalRecord = async (
	appointmentId: string,
): Promise<GetMedicalRecordResponse> => {
	const { data } = await api.get<GetMedicalRecordResponse>(
		`/appointments/${appointmentId}/medical-record`,
	);
	return data;
};

export const upsertMyMedicalRecord = async (
	record: MedicalRecordData,
): Promise<UpsertMedicalRecordResponse> => {
	const { data } = await api.put<UpsertMedicalRecordResponse>(
		"/medical-record",
		record,
	);
	return data;
};

export const useMyMedicalRecord = (enabled = true) => {
	return useQuery({
		queryKey: ["medical-record", "me"],
		queryFn: getMyMedicalRecord,
		enabled,
	});
};

export const useCustomerMedicalRecord = (
	customerId: string,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["medical-record", "customer", customerId],
		queryFn: () => getCustomerMedicalRecord(customerId),
		enabled: enabled && !!customerId,
	});
};

export const useAppointmentMedicalRecord = (
	appointmentId: string,
	enabled = true,
) => {
	return useQuery({
		queryKey: ["medical-record", "appointment", appointmentId],
		queryFn: () => getAppointmentMedicalRecord(appointmentId),
		enabled: enabled && !!appointmentId,
	});
};

export const useUpsertMyMedicalRecord = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: upsertMyMedicalRecord,
		onSuccess: (response) => {
			queryClient.setQueryData(["medical-record", "me"], response);
			if (response.medicalRecord.customerId) {
				queryClient.setQueryData(
					["medical-record", "customer", response.medicalRecord.customerId],
					response,
				);
			}
		},
	});
};
