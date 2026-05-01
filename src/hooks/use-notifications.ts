import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	GetNotificationPreferencesResponse,
	RegisterPushTokenData,
	RegisterPushTokenResponse,
	UnregisterPushTokenData,
	UnregisterPushTokenResponse,
	UpdateNotificationPreferencesData,
} from "@/types/notification";

export const getNotificationPreferences =
	async (): Promise<GetNotificationPreferencesResponse> => {
		const { data } = await api.get<GetNotificationPreferencesResponse>(
			"/notifications/preferences",
		);
		return data;
	};

export const useNotificationPreferences = (enabled = true) => {
	return useQuery({
		queryKey: ["notification-preferences"],
		queryFn: getNotificationPreferences,
		enabled,
	});
};

export const updateNotificationPreferences = async (
	payload: UpdateNotificationPreferencesData,
): Promise<GetNotificationPreferencesResponse> => {
	const { data } = await api.put<GetNotificationPreferencesResponse>(
		"/notifications/preferences",
		payload,
	);
	return data;
};

export const useUpdateNotificationPreferences = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateNotificationPreferences,
		onSuccess: (data) => {
			queryClient.setQueryData(["notification-preferences"], data);
		},
	});
};

export const registerPushToken = async (
	payload: RegisterPushTokenData,
): Promise<RegisterPushTokenResponse> => {
	const { data } = await api.post<RegisterPushTokenResponse>(
		"/notifications/push-tokens",
		payload,
	);
	return data;
};

export const unregisterPushToken = async (
	payload: UnregisterPushTokenData,
): Promise<UnregisterPushTokenResponse> => {
	const { data } = await api.post<UnregisterPushTokenResponse>(
		"/notifications/push-tokens/unregister",
		payload,
	);
	return data;
};
