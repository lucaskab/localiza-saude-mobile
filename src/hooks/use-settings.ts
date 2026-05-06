import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	AppInfoResponse,
	CreateSupportRequestData,
	CreateSupportRequestResponse,
} from "@/types/settings";

export const getAppInfo = async (): Promise<AppInfoResponse> => {
	const { data } = await api.get<AppInfoResponse>("/settings/app-info");
	return data;
};

export const useAppInfo = () => {
	return useQuery({
		queryKey: ["settings", "app-info"],
		queryFn: getAppInfo,
	});
};

export const createSupportRequest = async (
	payload: CreateSupportRequestData,
): Promise<CreateSupportRequestResponse> => {
	const { data } = await api.post<CreateSupportRequestResponse>(
		"/settings/requests",
		payload,
	);
	return data;
};

export const useCreateSupportRequest = () => {
	return useMutation({
		mutationFn: createSupportRequest,
	});
};
