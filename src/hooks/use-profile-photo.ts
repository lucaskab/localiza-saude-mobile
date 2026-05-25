import { api } from "@/services/api";
import type { User } from "@/types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type ProfilePhotoUploadFile = {
	uri: string;
	name: string;
	type: string;
};

type ProfilePhotoResponse = {
	user: User;
	photo: {
		url: string;
		expiresInSeconds: number;
	};
};

export const uploadProfilePhoto = async (
	userId: string,
	file: ProfilePhotoUploadFile,
): Promise<ProfilePhotoResponse> => {
	const formData = new FormData();

	// @ts-expect-error - React Native FormData accepts file objects with uri, name, and type
	formData.append("file", file);

	const { data } = await api.post<ProfilePhotoResponse>(
		`/users/${userId}/profile-photo`,
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		},
	);

	return data;
};

export const useUploadProfilePhoto = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			userId,
			file,
		}: {
			userId: string;
			file: ProfilePhotoUploadFile;
		}) => uploadProfilePhoto(userId, file),
		onSuccess: (response) => {
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", response.user.id],
			});
			queryClient.invalidateQueries({
				queryKey: ["healthcare-provider", "by-user", response.user.id],
			});
			queryClient.invalidateQueries({ queryKey: ["healthcare-providers"] });
		},
	});
};
